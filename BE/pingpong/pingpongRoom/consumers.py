from channels.generic.websocket import AsyncWebsocketConsumer
import json
from utils.printer import Printer
from coreManage.stateManager import StateManager

stateManager = StateManager()

class PingpongRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.client_id = None
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.state = stateManager.rooms[self.room_id]['state']
        self.game_manager = stateManager.rooms[self.room_id]['gameManager']
        await self.accept()
        # url을 수동으로 입력하면 접근이 가능한건가?
        Printer.log(f"Client connected to waiting room {self.room_id}", "blue")

    async def disconnect(self, close_code):
        if self.client_id:
            await self.game_manager._give_up_game(self)
            await stateManager._leave_waiting_room(self, self.room_id, self.client_id)
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
        Printer.log(f"<<<<<< ROOM {self.room_id} received <<<<<<", "magenta")
        Printer.log(f"event : {event}", "white")
        Printer.log(f"content : {content}\n", "white")
        
        await self.handle_event(event, content)

    async def handle_event(self, event, content):
        if event == 'changeReadyState':
            await self.change_ready_state(content)
        elif event == 'enterWaitingRoom':
            await self.enter_waiting_room(content)

    async def change_ready_state(self, content):
        await stateManager._change_ready_state(self, self.room_id, self.client_id, content['state'])
            
    async def enter_waiting_room(self, content):
        self.client_id = content['clientId']
        if not await stateManager._enter_waiting_room(self, self.room_id, self.client_id):
            # 실패시 처리 추가해야 할 듯?
            await self._send(event='enterWaitingRoomFailed', content={'roomId': self.room_id})
            Printer.log(f"Client {self.client_id} failed to enter room {self.room_id}", "yellow")
            return
        team_left_list, team_right_list = await stateManager._get_waiting_room_player_list(self.room_id)
        await self._send(event='enterWaitingRoomResponse',
                         content={'teamLeftList': team_left_list, 'teamRightList': team_right_list})
        Printer.log(f"Client {self.client_id} entered room {self.room_id}", "blue")

    """
    Notify methods
    """
    async def notifyGameGiveUp(self, content):
        self.state = 'waiting'
        await self._send(event='notifyGameGiveUp', content=content)
        
    async def notifyGameEnd(self, content):
        self.state = 'waiting'
        await self._send(event='notifyGameEnd', content=content)

    async def notifyPaddleLocationUpdate(self, content):
        await self._send(event='notifyPaddleLocationUpdate', content=content)

    async def notifyBallLocationUpdate(self, content):
        await self._send(event='notifyBallLocationUpdate', content=content)

    async def notifyScoreUpdate(self, content):
        await self._send(event='notifyScoreUpdate', content=content)

    async def notifyReadyStateChange(self, content):
        client_id = content['clientId']
        state = content['state']
        await self._send(event='notifyReadyStateChange', content={'clientId': client_id, 'state': state})

    async def notifyWaitingRoomEnter(self, content):
        await self._send(event='notifyWaitingRoomEnter', content=content)

    async def notifyWaitingRoomExit(self, content):
        await self._send(event='notifyWaitingRoomExit', content=content)

    async def notifyGameReady(self, content):
        await self._send(event='notifyGameReady', content=content)

    async def notifyGameStart(self, content):
        self.state = 'playing'
        await self._send(event='notifyGameStart', content=content)

    async def notifyCurrentPlayerCountChange(self, content):
        await self._send(event='notifyCurrentPlayerCountChange', content=content)