from channels.generic.websocket import AsyncWebsocketConsumer
import json
from utils.printer import Printer
from coreManage.stateManager import StateManager
from coreManage.group import add_group, discard_group, notify_group

stateManager = StateManager()

class PingpongRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.client_id = None
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.state = stateManager.rooms[self.room_id]['state']
        self.game_manager = stateManager.rooms[self.room_id]['gameManager']
        self.team = None
        await self.accept()
        # url을 수동으로 입력하면 접근이 가능한건가?
        Printer.log(f"Client connected to waiting room {self.room_id}", "blue")

    async def disconnect(self, close_code):
        if self.client_id:
            await self.game_manager.give_up_game(self)
            room_id_team = f"{self.room_id}-{self.team}"
            await stateManager.leave_waiting_room(self, self.room_id, self.client_id)
            await discard_group(self, self.room_id)
            await discard_group(self, room_id_team)
            Printer.log(f"Client {self.client_id} disconnected from room {self.room_id}", "yellow")

    async def _send(self, event=str, content=str):
        Printer.log(f">>>>> ROOM {self.room_id} sent >>>>>", "magenta")
        Printer.log(f"event : {event}", "white")
        Printer.log(f"conetnt : {content}\n", "white")
        data = { 'event': event, 'content': content }
        await self.send(json.dumps(data))

    async def receive(self, text_data):
        message = json.loads(text_data)
        
        event = message.get('event')
        content = message.get('content')
        if self.state == 'playing':
            await self.handle_playing_event(event, content)
        else:
            Printer.log(f"<<<<<< ROOM {self.room_id} received <<<<<<", "magenta")
            Printer.log(f"event : {event}", "white")
            Printer.log(f"content : {content}\n", "white")
            await self.handle_waiting_event(event, content)

    async def handle_playing_event(self, event, content):
        if event == 'updatePaddleLocation':
            await self.update_paddle_location(content)
            # await self.game_manager.update_paddle_location(self.client_id, content)
            content = {'clientId': self.client_id, 'xPosition': content['xPosition'], 'yPosition': content['yPosition']}
            await stateManager.notify_room(self.room_id, 'notifyPaddleLocationUpdate', content)
        
    async def handle_waiting_event(self, event, content):
        if event == 'changeReadyState':
            await self.change_ready_state(content)
        elif event == 'enterWaitingRoom':
            await self.enter_waiting_room(content)
        elif event == 'selectAbility':
            await self.select_ability(content)
    
    async def update_paddle_location(self, content):
        x = content['xPosition']
        y = content['yPosition']
        self.game_manager.update_target(self.client_id, x, y)

    async def change_ready_state(self, content):
        await stateManager.change_client_ready_state(self.room_id, self.client_id, content['state'])
            
    async def enter_waiting_room(self, content):
        self.client_id = content['clientId']
        team = stateManager.enter_waiting_room(self.room_id, self.client_id)
        if team == None:
            # 실패시 처리 추가해야 할 듯?
            await self._send(event='enterWaitingRoomFailed', content={'roomId': self.room_id})
            Printer.log(f"Client {self.client_id} failed to enter room {self.room_id}", "yellow")
            return
        self.team = team
        count = stateManager.get_room_client_count(self.room_id)
        await stateManager.notify_room_change(self.room_id, count)
        await stateManager.notify_room_enter(self.room_id, self.client_id, team)
        await add_group(self, self.room_id)
        await add_group(self, f"{self.room_id}-{team}")
        
        
        team_left_list, team_right_list = stateManager.get_waiting_room_player_list(self.room_id)
        team_left_ability, team_right_ability = stateManager.get_room_ability(self.room_id)
        await self._send(event='enterWaitingRoomResponse',
                         content={'teamLeftList': team_left_list, 
                                  'teamRightList': team_right_list,
                                  'teamLeftAbility': team_left_ability,
                                  'teamRightAbility': team_right_ability
                                  })
        Printer.log(f"Client {self.client_id} entered room {self.room_id}", "blue")

    async def select_ability(self, content):
        ability = content['ability']
        await stateManager.change_client_ability(self.room_id, self.client_id, ability)
        Printer.log(f"Client {self.client_id} selected ability {content['ability']}", "blue")

    """
    Notify methods
    """

    async def notifyPaddleLocationUpdate(self, content):
        await self._send(event='notifyPaddleLocationUpdate', content=content['content'])

    async def notifyBallLocationUpdate(self, content):
        await self._send(event='notifyBallLocationUpdate', content=content['content'])

    async def notifyScoreUpdate(self, content):
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

    async def notifyGameReady(self, content):
        await self._send(event='notifyGameReady', content=content['content'])

    async def notifyGameStart(self, content):
        self.state = 'playing'
        await self._send(event='notifyGameStart', content=content['content'])

    async def notifyGameGiveUp(self, content):
        self.state = 'waiting'
        await self._send(event='notifyGameGiveUp', content=content['content'])
        
    async def notifyGameEnd(self, content):
        self.state = 'waiting'
        await self._send(event='notifyGameEnd', content=content['content'])

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