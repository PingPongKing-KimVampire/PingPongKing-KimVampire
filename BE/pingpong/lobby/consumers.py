from channels.generic.websocket import AsyncWebsocketConsumer
import json
from coreManage.stateManager import StateManager
from utils.printer import Printer
from coreManage.group import add_group, discard_group, notify_group


stateManager = StateManager()

class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.is_init = False
        self.client_id = None
        await self.accept()

        ip = self.scope['client'][0] # scope 공부해볼것
        # sessionId = self.scope['session']['session_key']
        await add_group(self, 'lobby')
        Printer.log(f"New client connected from {ip}", "green")

    async def disconnect(self, close_code):
        if self.client_id:
            stateManager.remove_client(self, self.client_id)
            Printer.log(f"Client {self.client_id} disconnected", "red")
            await discard_group(self, 'lobby')

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
            await self.get_waiting_room_list_response()
        elif event == 'matchMakingStart':
            await self.match_making_start()
        elif event == 'matchMakingCancel':
            await self.match_making_cancel()

    async def enter_lobby(self, client_id):
        self.is_init = True # 인증으로 바꿔야함
        self.nickname = stateManager.get_client_nickname(client_id)
        Printer.log(f"Client {client_id} entered lobby : {self.nickname}", "blue")
        await self._send(event='enterLobbyResponse', content={'message': 'OK'})

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
    
    async def match_making_start(self):
        await discard_group(self, 'lobby')
        await stateManager.add_to_match_queue(self.client_id)

    async def match_making_cancel(self):
        await stateManager.remove_from_match_queue(self.client_id)
        await add_group(self, 'lobby')

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