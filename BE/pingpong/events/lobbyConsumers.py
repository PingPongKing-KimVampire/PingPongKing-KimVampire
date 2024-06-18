from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .stateManager import StateManager
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

    async def receive(self, text_data):
        message = json.loads(text_data)
        Printer.log(f"Received message: {message}", "purple")
        
        event = message.get('event')
        content = message.get('content')

        if not self.is_init:
            if event == 'enterLobby':
                await self.enter_lobby()
            else:
                await self.close()
            return

        await self.handle_event(event, content)

    ### Event Handlers
    #   - createWaitingRoom()
    #   - enterWaitingRoom()
    #   - leaveWaitingRoom()
    #   - getWaitingRoomList()
    async def handle_event(self, event, content):
        if event == 'createWaitingRoom':
            await self.create_waiting_room(content)
        elif event == 'enterWaitingRoom':
            await self.enter_waiting_room(content)
        elif event == 'getWaitingRoomList':
            await self.get_waiting_room_List()
    ### Event Handlers


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

    async def enter_lobby(self):
        data = {
            'event': 'enterLobbyResponse',
            'content': {
                'message': 'OK'
            }
        }
        self.send(json.dumps(data))

    async def create_waiting_room(self, content):
        room_id = stateManager._create_room(self.client_id, content['waitingRoomInfo'])
        await self._send(event='createWaitingRoomResponse', 
            content={
                'message': 'OK',
                'roomId': room_id
        })
        Printer.log(f"Waiting room {room_id} created", "blue")

    async def get_waiting_room_List(self):
        room_list = stateManager._get_waiting_room_list()
        await self._send(event='getWaitingRoomResponse', 
                         content={'waitingRoomList': room_list})

    async def _send(self, event, content):
        await self.send(json.dumps(text_data={
            'event': event,
            'content': content
        }))
        Printer.log(f"Sent message: {event}", "magenta")