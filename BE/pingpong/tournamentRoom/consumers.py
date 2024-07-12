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
        Printer.log(f"Client connected to tournament room {self.room_id}", "green")

    async def disconnect(self, close_code):
        if self.client_id:
            # await self.game_manager.give_up_game(self)
            # room_id_team = f"{self.room_id}-{self.team}"
            # await stateManager.leave_waiting_room(self, self.room_id, self.client_id)
            # await discard_group(self, self.room_id)
            # await discard_group(self, room_id_team)
            Printer.log(f"Client {self.client_id} disconnected from room {self.room_id}", "yellow")

    async def _send(self, event=str, content=str):
        Printer.log(f">>>>> Tournamnet {self.room_id} sent >>>>>", "bright_cyan")
        Printer.log(f"event : {event}", "white")
        Printer.log(f"conetnt : {content}\n", "white")
        data = { 'event': event, 'content': content }
        await self.send(json.dumps(data))

    async def receive(self, text_data):
        message = json.loads(text_data)
        
        event = message.get('event')
        content = message.get('content')
        if event == "enterTournamentRoom":
            await self.enter_tournament_room(content)
        elif event == "getTournamentGameInfo":
            pass

    async def enter_tournament_room(self, content):
        self.client_id = content['clientId']
        self.nickname = stateManager.get_client_nickname(self.client_id)
        # 인증 해야함
        await add_group(self, self.tournament_id)
        client_list = stateManager.get_tournament_client_list(self.tournament_id)
        client_list_data = []
        for client_id, nickname in client_list.items():
            content = {
                "clientId" : client_id,
                "nickname" : nickname,
                "clientAvartarUrl" : "/테스트중_수정할것.png"
                # "clientAvartarUrl" : stateManager.get_client_avatar_url(client_id)
            }
            client_list_data.append(content)
        await self._send("enterTournamentRoomResponse", 
                         { "tournamentClientList": client_list_data })