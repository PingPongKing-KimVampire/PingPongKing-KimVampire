from channels.generic.websocket import AsyncWebsocketConsumer
import json
from coreManage.stateManager import StateManager
from utils.printer import Printer

stateManager = StateManager()

class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.is_init = False
        self.client_id = None
        await self.accept()

        ip = self.scope['client'][0] # scope 공부해볼것
        # sessionId = self.scope['session']['session_key']
        Printer.log(f"New client connected from {ip}", "green")

    async def disconnect(self, close_code):
        if self.client_id:
            stateManager._remove_client(self, self.client_id)
            Printer.log(f"Client {self.client_id} disconnected", "red")

    async def _send(self, event, content):
        Printer.log(f">>>>> LOBBY sent >>>>>", "bright_cyan")
        Printer.log(f"event : {event}", "white")
        Printer.log(f"conetnt : {content}\n", "white")
        await self.send(json.dumps({ 'event': event, 'content': content }))

    async def receive(self, text_data):
        message = json.loads(text_data)
        event = message.get('event')
        content = message.get('content')
        Printer.log("<<<<<< LOBBY recieve <<<<<<", "bright_cyan")
        Printer.log(f"event : {event}", "white")
        Printer.log(f"content : {content}\n", "white")

        if not self.is_init:
            if event == 'enterLobby':
                await self.enter_lobby(content['clientId'])
            else:
                await self.close()
            return

        await self.handle_event(event, content)

    async def handle_event(self, event, content):
        if event == 'createWaitingRoom':
            await self.create_waiting_room(content)
        elif event == 'getWaitingRoomList':
            await self.get_waiting_room_List()

    async def init_client(self, client_id, client_nickname):
        if client_id in stateManager.clients:
            Printer.log(f"Duplicate clientId attempted: {self.client_id}", "red")
            await self.close()
            return

        self.client_id = client_id
        self.nickname = client_nickname
        self.is_init = True
        stateManager._add_client(self, client_id, self.nickname)

        Printer.log(f"Client {self.client_id} initialized with nickname {self.nickname}", "cyan")

    async def enter_lobby(self, client_id):
        Printer.log(f"Client {client_id} entered lobby", "cyan")
        self.is_init = True # 인증으로 바꿔야함
        self.nickname = "test"
        await stateManager._add_client(self, client_id, self.nickname)
        await self._send(event='enterLobbyResponse', content={'message': 'OK'})

    async def create_waiting_room(self, content):
        room_id = await stateManager._create_room(content['waitingRoomInfo'])
        await self._send(event='createWaitingRoomResponse', 
            content={
                'message': 'OK',
                'roomId': room_id
        })
        Printer.log(f"Waiting room {room_id} created", "blue")

    async def get_waiting_room_List(self):
        room_list = await stateManager._get_waiting_room_list()
        await self._send(event='getWaitingRoomResponse', 
                         content={'waitingRoomInfoList': room_list})
        
    async def notifyWaitingRoomCreated(self, content):
        await self._send(event='notifyWaitingRoomCreated', content=content)
        
    async def notifyCurrentPlayerCountChange(self, content):
        await self._send(event='notifyCurrentPlayerCountChange', content=content)
    
    async def notifyWaitingRoomClosed(self, content):
        await self._send(event='notifyWaitingRoomClosed', content=content)