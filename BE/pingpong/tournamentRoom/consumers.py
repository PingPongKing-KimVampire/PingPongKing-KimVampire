from channels.generic.websocket import AsyncWebsocketConsumer
import json
from utils.printer import Printer
from coreManage.stateManager import StateManager
from coreManage.group import add_group, discard_group, notify_group

stateManager = StateManager()

class TournamentRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.tournament_id = self.scope['url_route']['kwargs']['tournament_id']
        self.tournament_manager = stateManager.get_tournament_manager(self.tournament_id)
        self.client_id = None
        self.nickname = None
        self.tournament_state = "semi-final"
        self.tournament_info = stateManager.get_tournament_room(self.tournament_id)
        await self.accept()
        await add_group(self, self.tournament_id)
        Printer.log(f"Client connected to tournament room {self.room_id}", "green")

    async def disconnect(self, close_code):
        if self.client_id:
            # await self.game_manager.give_up_game(self)
            await discard_group(self, self.tournament_id)
            Printer.log(f"Client {self.client_id} disconnected from room {self.room_id}", "yellow")

    async def _send(self, event=str, content=str):
        Printer.log(f">>>>> Tournamnet {self.room_id} sent >>>>>", "bright_cyan")
        Printer.log(f"event : {event}", "white")
        Printer.log(f"conetnt : {content}\n", "white")
        data = { 'event': event, 'content': content }
        await self.send(json.dumps(data))
    
    async def set_consumer_info(self, client_id):
        from user.repositories import UserRepository
        user =  await UserRepository.get_user_by_id(client_id)
        if user is None:
            await self.close()
            return
        self.client_id = client_id
        self.nickname = user.nickname
        self.image_uri = user.image_uri

    async def receive(self, text_data):
        message = json.loads(text_data)
        
        event = message.get('event')
        content = message.get('content')
        if event == "enterTournamentRoom":
            await self.enter_tournament_room(content)
        elif event == "getTournamentGameInfo":
            pass

    async def enter_tournament_room(self, content):
        self.set_consumer_info(content['clientId'])
        client_info_list = self.tournament_manager.get_client_info_list()
        await self._send("enterTournamentRoomResponse", 
                         { "tournamentClientList": client_info_list })