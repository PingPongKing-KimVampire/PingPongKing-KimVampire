from channels.generic.websocket import AsyncWebsocketConsumer
import json
from utils.printer import Printer
from coreManage.stateManager import StateManager
from coreManage.group import add_group, discard_group, notify_group

stateManager = StateManager()

class TournamentRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.client_id = None
        self.tournament_id = self.scope['url_route']['kwargs']['tournament_id']
        self.tournament_state = "semi-final"
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
        # Printer.log(f">>>>> ROOM {self.room_id} sent >>>>>", "magenta")
        # Printer.log(f"event : {event}", "white")
        # Printer.log(f"conetnt : {content}\n", "white")
        data = { 'event': event, 'content': content }
        await self.send(json.dumps(data))

    async def receive(self, text_data):
        message = json.loads(text_data)
        
        event = message.get('event')
        content = message.get('content')
        if event == "enterTournamentRoom":
            pass
        elif event == "getTournamentRoom":
            pass