from channels.generic.websocket import AsyncWebsocketConsumer
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from django.core.exceptions import ObjectDoesNotExist
import json
import asyncio

from utils.printer import Printer
from coreManage.stateManager import StateManager
from coreManage.group import add_group, discard_group, notify_group

stateManager = StateManager()

class TournamentRoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Client Info
        self.client_id = None
        self.nickname = None
        self.gameroom_id_now = None

        # Tournament Room Info
        self.tournament_id = None
        self.tournament_manager = None
        self.tournament_state = None
        self.gameroom_id_now = None

        try:
            await stateManager.authorize_client(self, dict(self.scope['headers']))
            await self.accept(subprotocol="authorization")
        except (InvalidTokenError, ExpiredSignatureError, ObjectDoesNotExist, KeyError, AttributeError):
            await self.close()
        self.set_tournament_room_consumer(self.scope['url_route']['kwargs']['tournament_id'])
        await self.send_tournament_room_accept_response()
        await add_group(self, self.tournament_id)
        self.gameroom_id_now = self.tournament_manager.get_game_room_id_now(self.client_id, self.tournament_state)
        stateManager.add_consumer_to_map(self.client_id, self)
        asyncio.create_task(self.start_semi_final_room())
        Printer.log(f"Client connected to tournament room {self.tournament_id}", "green")

    def set_tournament_room_consumer(self, tournament_id):
        self.tournament_id = tournament_id
        self.tournament_state = "semiFinal"
        self.tournament_manager = stateManager.get_tournament_manager(self.tournament_id)
        self.tournament_manager.set_client_state(self.client_id, True)

    async def send_tournament_room_accept_response(self): 
        client_info_list = self.tournament_manager.get_client_info_list()
        client_list_data = []
        for client_info in client_info_list:
            content = {
                "id" : client_info['id'],
                "nickname" : client_info['nickname'],
                "avatarUrl" : client_info['avatarUrl']
            }
            client_list_data.append(content)
        await self._send("enterTournamentRoomResponse", 
                         { "tournamentClientList": client_list_data })
            
    async def disconnect(self, close_code):
        if self.client_id:
            stateManager.remove_consumer_from_map(self.client_id, self)
            await discard_group(self, self.tournament_id)
            self.tournament_manager.set_client_state(self.client_id, False)

    async def _send(self, event=str, content={}):
        Printer.log(f">>>>> Tournament {self.tournament_id} sent >>>>>", "bright_cyan")
        Printer.log(f"event : {event}", "white")
        Printer.log(f"content : {content}\n", "white")
        data = { 'event': event, 'content': content }
        await self.send(json.dumps(data))
    
    async def receive(self, text_data):
        message = json.loads(text_data)
        event = message.get('event')
        content = message.get('content')
        
        Printer.log(f"<<<< Tournament {self.tournament_id} recieve <<<<<", "bright_cyan")
        Printer.log(f"event : {event}", "white")
        Printer.log(f"content : {content}\n", "white")
        if event == "getTournamentGameInfo":
            await self.get_tournament_game_info_reponse()

    async def get_tournament_game_info_reponse(self):
        data = self.tournament_manager.get_tournament_info_list()
        await self._send("getTournamentGameInfoResponse", data)

    async def start_semi_final_room(self):                     
        await add_group(self, f"tournament_{self.gameroom_id_now}")
        await asyncio.sleep(3)
        await self.trigger_room_ready_notify()

    async def start_final_room(self, content):
        await self.trigger_room_ready_notify()

    async def trigger_room_ready_notify(self):
        if self.tournament_manager.is_opponent_ready(self.tournament_state, self.client_id):
            await self._send("notifyYourGameRoomReady", 
                            {'pingpongroomId' : self.gameroom_id_now, 
                            'stage' : self.tournament_state})
        else:
            await self._send("notifyOpponentLeave")
            await notify_group(self.channel_layer, f"tournament_{self.gameroom_id_now}", 
                                "notifyGameEnd", {'winner_id' : self.client_id})

    async def notifyGameEnd(self, content):
        content = content['content']
        winner_id = content['winner_id']

        Printer.log(f"winner id : {winner_id}")
        if winner_id == self.client_id:
            self.tournament_manager.change_tournamanet_info_game_state(self.tournament_state, self.gameroom_id_now, winner_id, 'finished')
            await self.notify_tournament_room('notifyTournamentInfoChange')
        await discard_group(self, f"tournament_{self.gameroom_id_now}")
        self.gameroom_id_now = None

        if self.tournament_state == 'semiFinal':
            if self.client_id == winner_id:
                self.tournament_state = 'final'
                self.tournament_manager.add_semi_final_winner(winner_id)
                if self.tournament_manager.all_client_finish() and \
                    self.tournament_manager.is_ready_final_room():
                    await self.tournament_manager.notify_all_team_finish(self, 'semiFinal')
        elif self.tournament_state == 'final':
            self.tournament_state = 'finish'
            if self.client_id == winner_id:
                await self.tournament_manager.notify_all_team_finish(self, 'final')

    async def updateGameroomScore(self, content):
        content = content['content']
        team = content['team']
        score = content['score']
        self.tournament_manager.update_room_score(self.tournament_state, self.gameroom_id_now, team, score)
        await self.notify_tournament_room("notifyTournamentInfoChange")

    async def notifyYourGameRoomReady(self, content):
        content = content['content']
        await self._send("notifyYourGameRoomReady", content)

    async def notifyGameStart(self, content):
        self.tournament_manager.change_tournamanet_info_game_state(self.tournament_state, self.gameroom_id_now, None, 'playing')
        await self.notify_tournament_room("notifyTournamentInfoChange")

    async def notifyAllTeamFinish(self, content):
        if self.tournament_state == 'final':
            print('결승 시작')
            self.gameroom_id_now = self.tournament_manager.get_game_room_id_now(self.client_id, self.tournament_state)
            await add_group(self, f"tournament_{self.gameroom_id_now}")
        await self._send("notifyAllTeamFinish", content['content'])
        
    async def notifyTournamentInfoChange(self, content):
        data = self.tournament_manager.get_tournament_info_list()
        await self._send("notifyTournamentInfoChange", data)
        
    async def notify_tournament_room(self, event, content={}):
        await notify_group(self.channel_layer, self.tournament_id, event, content)