from channels.generic.websocket import AsyncWebsocketConsumer
import json
from utils.printer import Printer
from coreManage.stateManager import StateManager
from coreManage.group import add_group, discard_group, notify_group
import asyncio

stateManager = StateManager()

class TournamentRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.tournament_id = self.scope['url_route']['kwargs']['tournament_id']
        self.tournament_manager = stateManager.get_tournament_manager(self.tournament_id)
        self.client_id = None
        self.nickname = None
        self.tournament_state = "semiFinal"
        self.gameroom_id_now = None
        await self.accept()
        await add_group(self, self.tournament_id)
        Printer.log(f"Client connected to tournament room {self.tournament_id}", "green")

    async def disconnect(self, close_code):
        if self.client_id:
            # await self.game_manager.give_up_game(self)
            await discard_group(self, self.tournament_id)
            Printer.log(f"Client {self.client_id} disconnected from room {self.room_id}", "yellow")

    async def _send(self, event=str, content=str):
        Printer.log(f">>>>> Tournament {self.tournament_id} sent >>>>>", "bright_cyan")
        Printer.log(f"event : {event}", "white")
        Printer.log(f"content : {content}\n", "white")
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
        
        Printer.log(f"<<<< Tournament {self.tournament_id} recieve <<<<<", "bright_cyan")
        Printer.log(f"event : {event}", "white")
        Printer.log(f"content : {content}\n", "white")
        if event == "enterTournamentRoom":
            await self.enter_tournament_room(content)
        elif event == "getTournamentGameInfo":
            await self.get_tournament_game_info_reponse()

    async def get_tournament_game_info_reponse(self):
        data = self.tournament_manager.get_tournament_info_list()
        await self._send("getTournamentGameInfoResponse", data)

    async def enter_tournament_room(self, content):
        await self.set_consumer_info(content['clientId'])
        client_info_list = self.tournament_manager.get_client_info_list()
        self.gameroom_id_now = self.tournament_manager.get_game_room_id_now(self.client_id, self.tournament_state)
        await self._send("enterTournamentRoomResponse", 
                         { "tournamentClientList": client_info_list })
        asyncio.create_task(self.start_semi_final_room(self.gameroom_id_now, self.tournament_state))

    async def start_semi_final_room(self, gameroom_id, tournament_state):                     
        await add_group(self, f"tournament_{gameroom_id}")
        await asyncio.sleep(3)
        await self._send("notifyYourGameRoomReady", 
                         {'pingpongroomId' : gameroom_id, 
                          'stage' : tournament_state})

    async def notifyGameEnd(self, content):
        winner_id = content['winner_id']
        self.tournament_manager.change_tournamanet_info_game_state(self.tournament_state, self.gameroom_id_now, 'finished')
        if self.tournament_state == 'semiFinal':
            if self.client_id == winner_id:
                self.tournament_state = 'final'
            room_id = self.tournament_manager.add_semi_final_winner(winner_id)
            if room_id:
                await self.tournament_manager.notify_all_team_finish('semiFinal')
        elif self.tournament_state == 'final':
            await self.tournament_manager.notify_all_team_finish('final')
        await discard_group(self, f"tournament_{self.gameroom_id_now}")
        self.gameroom_id_now = None

    async def updateGameroomScore(self, content):
        team = content['team']
        score = content['score']
        self.tournament_manager.update_room_score(self.tournament_state, self.gameroom_id_now, team, score)

    async def notifyYourGameReady(self, content):
        content = content['content']
        await self._send("notifyYourGameReady", content)

    async def notifyGameStart(self, content):
        self.tournament_manager.change_tournamanet_info_game_state(self.tournament_state, self.gameroom_id_now, 'playing')