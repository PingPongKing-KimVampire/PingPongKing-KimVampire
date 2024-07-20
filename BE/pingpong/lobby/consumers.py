from channels.generic.websocket import AsyncWebsocketConsumer
import json
from coreManage.stateManager import StateManager
from utils.printer import Printer
from coreManage.group import add_group, discard_group, notify_group
from django.core.exceptions import ObjectDoesNotExist


stateManager = StateManager()

class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
        from user.serializers import CustomTokenObtainPairSerializer
        from user.repositories import UserRepository
        self.client_id = None
        self.nickname = None
        self.avatar_url = None
        headers = dict(self.scope['headers'])
        token = headers.get(b'sec-websocket-protocol', b'')
        try:
            decoded_token = CustomTokenObtainPairSerializer.verify_token(token)
            client_id = decoded_token['user_id']
            user =  await UserRepository.get_user_by_id(client_id)
            if user is None:
                raise ObjectDoesNotExist("user not found")
            self.enter_lobby(user)
            await add_group(self, 'lobby')
            await self.accept(subprotocol="authorization")
            Printer.log("Lobby WebSocket connection established", "green")      
        except (InvalidTokenError, ExpiredSignatureError, ObjectDoesNotExist, KeyError, AttributeError):
            Printer.log("Authorize Failed, disconnect.", "red")
            await self.close()

    async def disconnect(self, close_code):
        if self.client_id:
            Printer.log(f"Client {self.client_id} disconnected", "red")
            await discard_group(self, 'lobby')

    def enter_lobby(self, user):
        self.client_id = user.id
        self.nickname = user.nickname
        self.avatar_url = user.get_image_uri()
        Printer.log(f"Client {self.client_id} entered lobby : {self.nickname} (id : {self.client_id})", "blue")

    async def _send(self, event, content):
        Printer.log(f">>>>> LOBBY sent >>>>>", "bright_cyan")
        Printer.log(f"event : {event}", "white")
        Printer.log(f"content : {content}\n", "white")
        await self.send(json.dumps({ 'event': event, 'content': content }))

    async def receive(self, text_data):
        message = json.loads(text_data)
        event = message.get('event')
        content = message.get('content')
        Printer.log("<<<<<< LOBBY recieve <<<<<<", "bright_cyan")
        Printer.log(f"event : {event}", "white")
        Printer.log(f"content : {content}\n", "white")

        await self.handle_event(event, content)

    async def handle_event(self, event, content):
        if event == 'createWaitingRoom':
            await self.create_waiting_room(content)
        elif event == 'getWaitingRoomList':
            await self.get_waiting_room_list_response()
        elif event == 'startMatchMaking':
            await self.match_making_start(self)
        elif event == 'cancelMatchMaking':
            await self.match_making_cancel(self)

    async def create_waiting_room(self, content):
        room_id = stateManager.create_room(content['waitingRoomInfo'])
        await self._send(event='createWaitingRoomResponse', 
            content={
                'message': 'OK',
                'roomId': room_id
        })

    async def get_waiting_room_list_response(self):
        room_list = stateManager.get_waiting_room_list()
        await self._send(event='getWaitingRoomResponse', 
                         content={'waitingRoomInfoList': room_list})

    # Match Making
    
    async def match_making_start(self, consumer):
        await discard_group(self, 'lobby')
        stateManager.add_to_match_queue(consumer)
        await self._send(event='startMatchMakingResponse', content={'message': 'OK'})

    async def match_making_cancel(self, consumer):
        stateManager.remove_from_match_queue(consumer)
        await add_group(self, 'lobby')
        await self._send(event='cancelMatchMakingResponse', content={'message': 'OK'})

    # Notify
    async def notifyWaitingRoomCreated(self, content):
        content = content['content']
        await self._send(event='notifyWaitingRoomCreated', content=content)
        
    async def notifyCurrentPlayerCountChange(self, content):
        content = content['content']
        await self._send(event='notifyCurrentPlayerCountChange', content=content)
    
    async def notifyWaitingRoomClosed(self, content):
        content = content['content']
        await self._send(event='notifyWaitingRoomClosed', content=content)
    
    async def notifyMatchMakingComplete(self, content):
        content = content['content']
        await self._send(event='notifyMatchMakingComplete', content=content)