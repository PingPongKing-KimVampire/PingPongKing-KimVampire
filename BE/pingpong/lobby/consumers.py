from channels.generic.websocket import AsyncWebsocketConsumer
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from django.core.exceptions import ObjectDoesNotExist
import json

from coreManage.stateManager import StateManager
from utils.printer import Printer
from coreManage.group import add_group, discard_group, notify_group

stateManager = StateManager()

class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.client_id = None
        self.nickname = None
        self.avatar_url = None
        
        try:  
            await stateManager.authorize_client(self, dict(self.scope['headers']))
            await self.accept(subprotocol="authorization")
        except (InvalidTokenError, ExpiredSignatureError, ObjectDoesNotExist, KeyError, AttributeError):
            Printer.log("Authorize Failed, disconnect.", "red")
            await self.close()
        await add_group(self, 'lobby')
        Printer.log("Lobby WebSocket connection established", "green")      
        Printer.log(f"Client {self.client_id} entered lobby : {self.nickname} (id : {self.client_id})", "green")

    async def disconnect(self, close_code):
        Printer.log(f"Client {self.client_id} disconnected", "red")
        Printer.log(f"Close code: {close_code}", "red")
        await discard_group(self, 'lobby')

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