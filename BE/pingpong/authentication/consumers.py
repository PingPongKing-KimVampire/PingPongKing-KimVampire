from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
from utils.printer import Printer
from coreManage.stateManager import StateManager

stateManager = StateManager()

class AuthConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.is_init = False
        await self.accept()
        Printer.log("WebSocket connection established", "green")

        # 60초 타임아웃, 60초 안에 init이 안되면 disconnect
        asyncio.create_task(self.check_timeout(60)) 
        
    async def check_timeout(self, timeout):
        await asyncio.sleep(timeout)
        if not self.is_init:
            Printer.log("Client not initialized within timeout period, disconnecting...", "yellow")
            await self.close()

    async def disconnect(self, close_code):
        Printer.log("WebSocket connection closed", "red")
        
    async def _send(self, event, content):
        Printer.log(f">>>>> AUTH sent >>>>>", "cyan")
        Printer.log(f"event : {event}", "cyan")
        Printer.log(f"conetnt : {content}", "cyan")
        await self.send(json.dumps({ 'event': event, 'content': content }))

    async def receive(self, text_data):
        message = json.loads(text_data)
        event = message.get('event')
        content = message.get('content')

        if event == 'initClient':
            clientId = content['clientId']
            client_nickname = content['clientNickname']
            await self.init_client(clientId, client_nickname)

    async def init_client(self, client_id, client_nickname):
        if client_id in stateManager.clients:
            await self.close()
        
        self.is_init = True
        self.client_id = client_id
        self.client_nickname = client_nickname
        stateManager.add_client(self, client_id, client_nickname)
        await self._send('initClientResponse', {'message': 'OK'})