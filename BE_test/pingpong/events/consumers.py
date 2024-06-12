from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .stateManager import StateManager
from utils.printer import Printer

state_manager = StateManager()

class PingpongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.client_id = state_manager.add_client(self)
        self.is_init = False
        await self.accept()
        Printer.log(f"Client {self.client_id} connected", "green")

    async def disconnect(self, close_code):
        state_manager.remove_client(self.client_id)
        Printer.log(f"Client {self.client_id} disconnected", "red")

    async def receive(self, text_data):
        message = json.loads(text_data)
        Printer.log(f"Received message: {message}", "green")
        sender = message.get('sender')
        receiver = message.get('receiver')
        event = message.get('event')
        content = message.get('content')

        if not self.is_init and event != 'initClient':
            await self.send_not_init_msg()
            return

        if 'server' in receiver:
            if event == 'initClient':
                await self.init_client(content['clientId'], content['clientNickname'])
            elif event == 'createPingpongRoom':
                await self.create_pingpong_room()
            elif event == 'getPingpongRoomList':
                await self.get_pingpong_room_list()
            elif event == 'enterPingpongRoomResponse':
                await self.enter_pingpong_room_response(message)
        if 'player' in receiver:
            room_id = content.get('roomId')
            if not room_id or not state_manager.get_room(room_id):
                await self.send_no_room_msg(message)
                return
            player_list = state_manager.get_room(room_id)['players']
            for player in player_list:
                await player.send(json.dumps(message))
        if 'referee' in receiver:
            room_id = content.get('roomId')
            if not room_id or not state_manager.get_room(room_id):
                await self.send_no_room_msg(message)
                return
            referee = state_manager.get_room(room_id)['referee']
            await referee.send(json.dumps(message))

    async def init_client(self, client_id, client_nickname):
        self.client_id = client_id
        self.nickname = client_nickname
        self.is_init = True
        state_manager.clients[self.client_id] = self  # Ensure the client is added to the state manager
        await self.send(json.dumps({
            'sender': 'server',
            'receiver': ['client'],
            'event': 'registerClientSuccess'
        }))
        Printer.log(f"Client {self.client_id} initialized with nickname {self.nickname}", "cyan")

    async def send_not_init_msg(self):
        await self.send(json.dumps({
            'sender': 'server',
            'receiver': ['client'],
            'event': 'notInit'
        }))
        Printer.log(f"Client {self.client_id} is not initialized", "yellow")

    async def create_pingpong_room(self):
        room_id = state_manager.create_room(self)
        await self.send(json.dumps({
            'sender': 'server',
            'receiver': ['client'],
            'event': 'appointReferee',
            'content': {'roomId': room_id}
        }))
        Printer.log(f"Room {room_id} created", "blue")

    async def get_pingpong_room_list(self):
        room_list = state_manager.get_room_list()
        await self.send(json.dumps({
            'sender': 'server',
            'receiver': ['client'],
            'event': 'getPingpongRoomResponse',
            'content': {'roomIdList': room_list}
        }))
        Printer.log(f"Room list sent to client {self.client_id}", "blue")

    async def enter_pingpong_room_response(self, message):
        content = message['content']
        room_id = content['roomId']
        client_id = content['clientId']
        Printer.log(f"room_id: {room_id}, client_id: {client_id}", "blue")

        room = state_manager.get_room(room_id)
        if not room:
            await self.send_no_room_msg(message)
            return
        
        player = state_manager.clients.get(client_id)
        if not player:
            Printer.log(f"Client ID {client_id} not found", "red")
            await self.send_no_room_msg(message)
            return

        state_manager.add_player_to_room(room_id, player)
        
        Printer.log(f"Client {client_id} entered room {room_id}", "blue")
        await player.send(json.dumps(message))

    async def send_no_room_msg(self, message):
        await self.send(json.dumps({
            'sender': 'server',
            'receiver': ['client'],
            'event': 'noRoom',
            'content': {'clientMsg': message}
        }))
        Printer.log("Room not found", "yellow")