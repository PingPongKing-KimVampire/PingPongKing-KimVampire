from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
from utils.printer import Printer
from coreManage.stateManager import StateManager
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

stateManager = StateManager()
default_image_uri = "fe/images/playerA.png"

class GlobalConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        from .serializers import CustomTokenObtainPairSerializer
        self.is_init = False
        # 주석 친 코드 : 연결 과정에서 하는 거 프론트에서 처리된 이후에 처리
        # headers = dict(self.scope['headers'])
        # bearer_access_token = headers.get(b'authorization', b'').decode('utf-8')
        try:
            # token_array = bearer_access_token.split(" ")
            # if token_array[0] != "Bearer":
            #     raise InvalidTokenError("Bearer Error")
            # access_token = token_array[1]
            # decoded_token = CustomTokenObtainPairSerializer.verify_token(access_token)
            await self.accept()
            Printer.log("WebSocket connection established", "green")      
            asyncio.create_task(self.check_timeout(60))
        except (InvalidTokenError, ExpiredSignatureError, KeyError, AttributeError):
            Printer.log("Invalid Authorization header, closing connection", "red")
            await self.close()
        
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
            access_token = content['accessToken']
            await self.init_client(access_token)
        # if event == '':


    async def init_client(self, access_token):
        from .serializers import CustomTokenObtainPairSerializer
        try:
            decoded_token = CustomTokenObtainPairSerializer.verify_token(access_token)
        except (InvalidTokenError, ExpiredSignatureError, KeyError, AttributeError):
            Printer.log("Invalid Authorization header, closing connection", "red")
            await self.close()
        client_id = decoded_token['user_id']
        print(client_id)
        if client_id in stateManager.clients:
            await self.close()
        
        self.is_init = True
        self.client_id = client_id
        self.client_nickname = decoded_token['nickname']
        stateManager.add_user(client_id, decoded_token['nickname'])
        await stateManager._add_client(self, client_id, decoded_token['nickname'])
        image_uri = decoded_token['image_uri']
        if image_uri is None:
            image_uri = default_image_uri
        response = {
            "event": "initClientResponse",
            "content": {
                "clientId": decoded_token['user_id'],  # Assuming user_id is in the token
                "clientNickname": decoded_token['nickname'],  # Assuming nickname is in the token
                "clientAvatarUrl": default_image_uri,  # Example URL, adjust as necessary
                "message": "OK"
            }
        }
        await self._send('initClientResponse', response)