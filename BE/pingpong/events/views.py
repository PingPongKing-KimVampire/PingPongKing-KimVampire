from channels.generic.websocket import AsyncWebsocketConsumer
import json
import uuid

class PingpongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.client_id = str(uuid.uuid4())
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        data = json.loads(text_data)
        event = data.get('event')
        if event == 'initClient':
            await self.init_client(data['content'])
        elif event == 'createPingpongRoom':
            await self.create_pingpong_room()

    async def init_client(self, content):
        pass

    async def create_pingpong_room(self):
        pass