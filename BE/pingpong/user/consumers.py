from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
from utils.printer import Printer
from coreManage.stateManager import StateManager
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
import os
import base64
import uuid
from django.core.files.base import ContentFile
from django.conf import settings


stateManager = StateManager()
DEFAULT_IMAGE_URI = "images/playerA.png"
DEFAULT_IMAGE_STORAGE = "../BE/data_image/"

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
        # Printer.log(f"conetnt : {content}", "cyan")
        await self.send(json.dumps({ 'event': event, 'content': content }))

    async def receive(self, text_data):
        message = json.loads(text_data)
        event = message.get('event')
        content = message.get('content')

        if event == 'initClient':
            access_token = content['accessToken']
            await self.init_client(access_token)
        if event == 'updateClientInfo':
            waiting_room_info = content['waitingRoomInfo']
            await self.updateClientInfo(waiting_room_info)


    async def init_client(self, access_token):
        from .serializers import CustomTokenObtainPairSerializer
        try:
            decoded_token = CustomTokenObtainPairSerializer.verify_token(access_token)
        except (InvalidTokenError, ExpiredSignatureError, KeyError, AttributeError):
            Printer.log("Invalid Authorization header, closing connection", "red")
            await self.close()
        client_id = decoded_token['user_id']
        if client_id in stateManager.clients:
            await self.close()
        
        self.is_init = True
        self.client_id = client_id
        self.client_nickname = decoded_token['nickname']
        stateManager.add_user(client_id, decoded_token['nickname'])
        await stateManager._add_client(self, client_id, decoded_token['nickname'])
        image_uri = decoded_token['image_uri']
        if image_uri is None:
            image_uri = DEFAULT_IMAGE_URI
        response = {
            "clientId": decoded_token['user_id'],  # Assuming user_id is in the token
            "clientNickname": decoded_token['nickname'],  # Assuming nickname is in the token
            "clientAvatarUrl": DEFAULT_IMAGE_URI,  # Example URL, adjust as necessary
            "message": "OK"
        }
        await self._send('initClientResponse', response)

    async def updateClientInfo(self, waiting_room_info):
        from .repositories import UserRepository
        avatar_image = waiting_room_info['avatarImage']
        if 'ImageUrl' not in avatar_image and avatar_image['imageData'] is not None:
            target_image_uri =  await self.upload_image(avatar_image['imageData'])
            if len(target_image_uri) >= MAX_URI_LENGTH:
                await self._send("updateClientInfoResponse", {"message": "longURILength"})
                return 
        elif avatar_image['ImageUrl'] is not None and 'imageData' not in avatar_image:
            target_image_uri = avatar_image['ImageUrl']
        else:
            await self._send("updateClientInfoResponse", {"message": "invalidAvatarImage"})
            return
        if "nickname" not in waiting_room_info:
            user = await UserRepository.get_user_by_id(self.client_id)
            await UserRepository.update_user_image_uri(user, target_image_uri)
            await self._send("updateClientInfoResponse", {"message": "OK"})
        else:
            nickname = waiting_room_info['nickname']
            isDuplicated = await UserRepository.exists_user_by_nickname_async(nickname)
            if isDuplicated:
                await self._send("updateClientInfoResponse", {"message": "duplicatedNickname"})
                return
            user = await UserRepository.get_user_by_id(self.client_id)
            await UserRepository.update_user_image_uri_and_nickname(user, target_image_uri, nickname)
            await self._send("updateClientInfoResponse", {"message": "OK"})
    
    async def upload_image(self, image_data):
        format, imgstr = image_data.split(';base64,')
        ext = format.split('/')[-1]
        file_name = f'{uuid.uuid4()}.{ext}'
        data = ContentFile(base64.b64decode(imgstr), name=file_name)
        file_path = os.path.join(settings.MEDIA_ROOT, data.name)
        with open(file_path, 'wb') as f:
            f.write(data.read())
        file_url = os.path.join(settings.MEDIA_URL, file_name)
        return file_url

    # async def get_friends():