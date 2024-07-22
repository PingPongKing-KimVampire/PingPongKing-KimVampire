from channels.generic.websocket import AsyncWebsocketConsumer
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from django.core.exceptions import ObjectDoesNotExist
import json

from utils.printer import Printer
from coreManage.stateManager import StateManager
from coreManage.group import add_group, discard_group, notify_group

stateManager = StateManager()

class PingpongRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Client Info
        self.client_id = None
        self.nickname = None
        self.avatar_uri = None

        # Pingpong Room Info
        self.room_id = None
        self.game_manager = None
        self.game_mode = None
        self.team = None
        self.game_state = None
        
        try:
            await stateManager.authorize_client(self, dict(self.scope['headers']))
            await self.accept(subprotocol="authorization")
            self.set_pingpong_room_consumer(self.scope['url_route']['kwargs']['room_id'])
            await self.send_pingpongroom_accept_response()
            await add_group(self, self.room_id)
            Printer.log(f"Client connected to waiting room {self.room_id}", "blue")
        except:
            await self.close()

    def set_pingpong_room_consumer(self, room_id):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.game_state = 'waiting'
        self.game_manager = stateManager.rooms[self.room_id]
        self.game_mode = self.game_manager.mode

    async def send_pingpongroom_accept_response(self):
        if self.game_mode == 'tournament':
            self.team = self.game_manager.get_client_team_in_room(self.client_id)
        else: # normal mode
            self.team, is_you_create = stateManager.enter_waiting_room(self.room_id, self.client_id, self.nickname, self.avatar_uri)
            await self.send_enter_pingpongroom_response(self.room_id, is_you_create)
        if self.team == None:
            # 실패시 처리 추가해야 할 것.
            await self._send(event='enterWaitingRoomFailed', content={'roomId': self.room_id})
            Printer.log(f"Client {self.client_id} failed to enter room {self.room_id}", "yellow")
            await self.close()
        Printer.log(f"Client {self.client_id} entered room {self.room_id}", "blue")
        Printer.log(f"team : {self.team}", "blue")
            
    async def disconnect(self, close_code):
        if self.client_id:
            await self.game_manager.give_up_game(self)
            room_id_team = f"{self.room_id}-{self.team}"
            stateManager.remove_client_from_room(self.room_id, self.client_id)
            await stateManager.notify_room_change(self.room_id)
            await stateManager.notify_leave_waiting_room(self.room_id, self.client_id)
            await discard_group(self, self.room_id)
            await discard_group(self, room_id_team)
            Printer.log(f"Client {self.client_id} disconnected from room {self.room_id}", "yellow")

    async def _send(self, event=str, content=str):
        if not (event == "notifyBallLocationUpdate" or event == "notifyPaddleLocationUpdate"):
            Printer.log(f">>>>> ROOM {self.room_id} sent >>>>>", "magenta")
            Printer.log(f"event : {event}", "white")
            Printer.log(f"content : {content}\n", "white")
        data = { 'event': event, 'content': content }
        await self.send(json.dumps(data))
    
    async def receive(self, text_data):
        message = json.loads(text_data)
        
        event = message.get('event')
        content = message.get('content')
        if self.game_state == 'playing':
            await self.handle_playing_event(event, content)
        else:
            Printer.log(f"<<<<<< ROOM {self.room_id} received <<<<<<", "magenta")
            Printer.log(f"event : {event}", "white")
            Printer.log(f"content : {content}\n", "white")
            await self.handle_waiting_event(event, content)

    async def handle_playing_event(self, event, content):
        if event == 'updatePaddleLocation':
            await self.update_paddle_location(content)
        
    async def handle_waiting_event(self, event, content):
        if event == 'changeReadyState':
            await self.change_ready_state(content)
        elif event == 'selectAbility':
            await self.select_ability(content)
    
    async def update_paddle_location(self, content):
        x = content['xPosition']
        y = content['yPosition']
        self.game_manager.update_target(self.client_id, x, y)

    async def change_ready_state(self, content):
        is_ready = content['state']
        stateManager.change_client_ready_state(self.room_id, self.client_id, is_ready)
        await stateManager.notify_ready_state_change(self.room_id, self.client_id, is_ready)
            

    async def select_ability(self, content):
        ability = content['ability']
        stateManager.change_client_ability(self.room_id, self.client_id, ability)
        await stateManager.notify_select_ability(self.room_id, self.client_id, ability)
        Printer.log(f"Client {self.client_id} selected ability {content['ability']}", "blue")

    async def send_enter_pingpongroom_response(self, room_id, is_you_create):
        await stateManager.notify_room_enter(self.room_id, self.client_id, self.avatar_uri, self.nickname, self.team)
        
        if is_you_create:
            await stateManager.notify_room_created(self.room_id)
        else:
            await stateManager.notify_room_change(self.room_id)

        content = stateManager.get_entering_room_info(room_id)
        await self._send(event='enterWaitingRoomResponse', content=content)

    """
    Notify methods
    """

    async def notifyPaddleLocationUpdate(self, content):
        await self._send(event='notifyPaddleLocationUpdate', content=content['content'])

    async def notifyBallLocationUpdate(self, content):
        await self._send(event='notifyBallLocationUpdate', content=content['content'])

    async def notifyScoreUpdate(self, content):
        if self.game_mode == 'tournament':
            await notify_group(self.channel_layer, f"tournament_{self.room_id}", 'updateGameroomScore', content['content'])
        await self._send(event='notifyScoreUpdate', content=content['content'])
    
    async def notifySelectAbility(self, content):
        await self._send(event='notifySelectAbility', content=content['content'])

    async def notifyReadyStateChange(self, content):
        content = content['content']
        client_id = content['clientId']
        state = content['state']
        await self._send(event='notifyReadyStateChange', content={'clientId': client_id, 'state': state})

    async def notifyWaitingRoomEnter(self, content):
        await self._send(event='notifyWaitingRoomEnter', content=content['content'])

    async def notifyWaitingRoomExit(self, content):
        await self._send(event='notifyWaitingRoomExit', content=content['content'])

    async def notifyGameRoomReady(self, content):
        await self._send(event='notifyGameRoomReady', content=content['content'])

    async def notifyGameStart(self, content):
        self.game_state = 'playing'
        if self.game_mode == 'tournament':
            await notify_group(self.channel_layer, f"tournament_{self.room_id}", "notifyGameStart", {})
        await self._send(event='notifyGameStart', content=content['content'])

    async def notifyGameGiveUp(self, content):
        self.game_state = 'waiting'
        await self._send(event='notifyGameGiveUp', content=content['content'])
        
    async def notifyGameEnd(self, content):
        content = content['content']
        self.game_state = 'waiting'
        win_team = content['winTeam']
        if self.game_mode == 'tournament' and self.team == win_team:
            await notify_group(self.channel_layer, f"tournament_{self.room_id}", "notifyGameEnd", {'winner_id' : self.client_id})
        await self._send(event='notifyGameEnd', content=content)
        await self.close()

    async def notifyGhostBall(self, content):
        Printer.log(f"Ghost ball", "green")
        await self._send(event='notifyGhostBall', content=content['content'])

    async def notifyFakeBallCreate(self, content):
        await self._send(event='notifyFakeBallCreate', content=content['content'])

    async def notifyFakeBallRemove(self, content):
        await self._send(event='notifyFakeBallRemove', content=content['content'])

    async def notifyUnghostBall(self, content):
        Printer.log(f"Unghost ball", "green")
        await self._send(event='notifyUnghostBall', content=content['content'])

    async def notifyFakeBallLocationUpdate(self, content):
        await self._send(event='notifyFakeBallLocationUpdate', content=content['content'])

    async def notifySpeedTwistBall(self, content):
        await self._send(event='notifySpeedTwistBall', content=content['content'])

    async def notifyUnspeedTwistBall(self, content):
        await self._send(event='notifyUnspeedTwistBall', content=content['content'])