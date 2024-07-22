import django
django.setup()

from typing import Dict, Any, Optional, List, Tuple
import uuid
from asyncio import sleep, create_task
import asyncio
from django.core.exceptions import ObjectDoesNotExist

from .group import notify_group, add_group
from pingpongRoom.gameManage.gameRoomManager import GameRoomManager
from utils.printer import Printer
from tournamentRoom.tournament.tournamentManager import TournamentManager

from user.serializers import CustomTokenObtainPairSerializer
from user.repositories import UserRepository


class StateManager:
    _instance: Optional['StateManager'] = None

    def __new__(cls) -> 'StateManager':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self) -> None:
        self.channel_layer = None
        self.lobby_clients = []
        self.rooms = {}
        self.match_making_loop_task = None
        self.match_queue = []
        self.is_match_task_running = False
        self.tournaments = {}
        
    def get_channel_layer(self):
        return self.channel_layer

    async def authorize_client(self, consumer, headers):
        token = headers.get(b'sec-websocket-protocol', b'')
        decoded_token = CustomTokenObtainPairSerializer.verify_token(token)
        consumer.client_id = decoded_token['user_id']
        user =  await UserRepository.get_user_by_id(consumer.client_id)
        if user is None:
                raise ObjectDoesNotExist("user not found")
        consumer.nickname = user.nickname
        consumer.avatar_url = user.get_image_uri()
        # print(consumer.client_id)
        # print(consumer.nickname)
        # print(consumer.avatar_url)

    def add_lobby_client(self, client_id):
        if client_id not in self.lobby_clients:
            self.lobby_clients.append(client_id)
            Printer.log(f"Client {client_id} added to lobby arrary")
        else:
            Printer.log(f"Client {client_id} already in lobby arrary", "red")

    def remove_lobby_client(self, client_id):
        if client_id in self.lobby_clients:
            self.lobby_clients.remove(client_id)
            Printer.log(f"Client {client_id} removed")
        else:
            Printer.log(f"Client {client_id} is not in lobby arrary", "red")
    
    def is_client_in_lobby(self, client_id):
        if client_id in self.lobby_clients:
            print(f"Client {client_id} is in the lobby.")
            return True
        else:
            print(f"Client {client_id} is not in the lobby.")
            return False

    # Matchmaking Management
    def add_to_match_queue(self, consumer) -> None:
        self.match_queue.append(consumer)
        Printer.log(f"Client {consumer.client_id} added to match queue", "blue")

    def remove_from_match_queue(self, consumer) -> None:
        self.match_queue.remove(consumer)
        Printer.log(f"Client {consumer.client_id} removed from match queue", "blue")

    def is_match_queue_full(self) -> bool:
        return len(self.match_queue) >= 4

    async def group_match_clients(self, match_clients, tournament_id) -> None:
        await asyncio.gather(*[add_group(consumer, tournament_id) for consumer in match_clients])
        await notify_group(self.channel_layer, tournament_id, 
                            'notifyMatchMakingComplete', {'tournamentId': tournament_id})

    async def match_making_loop(self) -> None:
        while 1:
            if self.is_match_queue_full():
                match_clients = self.match_queue[:4]
                self.match_queue = self.match_queue[4:]
                tournament_id = self.create_tournament_manager(match_clients)
                await self.group_match_clients(match_clients, tournament_id)
            await sleep(1)

    def create_tournament_manager(self, match_clients) -> str:
        tournament_id = str(uuid.uuid4())
        self.tournaments[tournament_id] = TournamentManager(self, self.channel_layer, tournament_id, match_clients)
        return tournament_id

    def get_tournament_manager(self, tournament_id: str) -> TournamentManager:
        return self.tournaments.get(tournament_id, None)

    def add_channel_layer(self, channel_layer) -> None:
        if self.channel_layer is None:
            self.channel_layer = channel_layer
            self.make_test_rooms()
            create_task(self.match_making_loop())

    # Room Management
    def create_room(self, content: Dict[str, Any]) -> str:
        room_id = str(uuid.uuid4())
        while room_id in self.rooms:
            room_id = str(uuid.uuid4())
        title = content['title']
        leftMode = content['leftMode']
        rightMode = content['rightMode']
        leftPlayerCount = content['leftPlayerCount']
        rightPlayerCount = content['rightPlayerCount']
        self.rooms[room_id] = GameRoomManager(self.channel_layer, room_id, title, 
                            leftMode, rightMode, leftPlayerCount, rightPlayerCount, mode='normal')
        Printer.log(f"Room {room_id} created", "blue")
        return room_id

    def get_room_client_count(self, room_id: str) -> int:
        room = self.rooms.get(room_id, None)
        return room.get_room_client_count() if room else 0

    def get_room_ability(self, room_id: str) -> Dict[str, str]:
        room = self.rooms.get(room_id, )
        return room.get_room_ability()

    def enter_waiting_room(self, room_id: str, client_id: str, nickname: str, image_uri: str) -> Optional[str]:
        is_you_create = False
        room = self.rooms.get(room_id)
        if not room:
            return None
        if room.is_room_empty():
            is_you_create = True
        team = room.enter_room(client_id, nickname, image_uri)
        return team, is_you_create

    def remove_client_from_room(self, room_id: str, client_id: str) -> None:
        room = self.rooms.get(room_id, None)
        room.remove_client(client_id) if room else None

    def get_waiting_room_list(self) -> List[Dict[str, Any]]:
        data = []
        for room in self.rooms.values():
            if room.mode == 'normal':
                data.append(room.get_room_data())
        return data

    def get_waiting_room_player_list(self, room_id: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        room = self.rooms.get(room_id, None)
        return room.get_team_list('left'), room.get_team_list('right')

    def change_client_ready_state(self, room_id: str, client_id: str, is_ready: str) -> None:
        room = self.rooms.get(room_id, None)
        room.set_client_ready_state(client_id, is_ready)
    
    def change_client_ability(self, room_id: str, client_id: str, ability: str) -> None:
        room = self.rooms.get(room_id, None)
        room.set_client_ability(client_id, ability)

    def check_game_ready(self, room_id: str) -> bool:
        room = self.rooms.get(room_id, None)
        return room.check_game_ready()

    def get_entering_room_info(self, room_id: str) -> Dict[str, Any]:
        team_left_list, team_right_list = self.get_waiting_room_player_list(room_id)
        team_left_ability, team_right_ability = self.get_room_ability(room_id)
        content = {
            'teamLeftList': team_left_list,
            'teamRightList': team_right_list,
            'teamLeftAbility': team_left_ability,
            'teamRightAbility': team_right_ability
        }
        return content

    # Asynchronous Methods
    async def notify_room_enter(self, room_id: str, client_id: str, avatar_url: str, nickname: str, team: str) -> None:
        enter_data = {'id': client_id, 'nickname': nickname, 'avatarUrl' : avatar_url, 'team': team}
        await self.notify_room(room_id, event='notifyWaitingRoomEnter', content=enter_data)

    async def notify_leave_waiting_room(self, room_id: str, client_id: str) -> None:
        await self.notify_room(room_id, event='notifyWaitingRoomExit', content={'clientId': client_id})
        if self.get_room_client_count(room_id) == 0:
            del self.rooms[room_id]
            await self.notify_lobby('notifyWaitingRoomClosed', {'waitingRoomInfo': {'roomId': room_id}})

    async def notify_room_change(self, room_id: str) -> None:
        count = self.get_room_client_count(room_id)
        await self.notify_lobby('notifyCurrentPlayerCountChange', {'currentPlayerCount': count, 'roomId': room_id})

    async def notify_room_created(self, room_id: str) -> None:
        room = self.rooms.get(room_id, None)
        room_data = room.get_room_data()
        await self.notify_lobby('notifyWaitingRoomCreated', {'waitingRoomInfo' : room_data})

    async def notify_ready_state_change(self, room_id: str, client_id: str, is_ready: str) -> None:
        await self.notify_room(room_id, event='notifyReadyStateChange', content={'clientId': client_id, 'state': is_ready})
        if is_ready == "READY" and self.check_game_ready(room_id):
            Printer.log(f"Both teams are ready in room {room_id}. Notifying game ready.", "green")
            await self.start_game(room_id)

    async def notify_select_ability(self, room_id: str, client_id: str, ability: str) -> None:
        room = self.rooms.get(room_id, None)
        team, ability = room.get_client_ability(client_id)
        await self.notify_room(room_id, event='notifySelectAbility', content={'team': team, 'ability': ability})

    async def start_game(self, room_id: str) -> None:
        room = self.rooms.get(room_id, None)
        game_manager = room
        if game_manager:
            if game_manager.mode == 'normal':
                await self.notify_lobby('notifyWaitingRoomClosed', {'waitingRoomInfo': {'roomId': room_id}})
            await game_manager.trigger_game()

    async def notify_lobby(self, event: str, content: Dict[str, Any]) -> None:
        if self.channel_layer:
            Printer.log(f"!!!!! notify LOBBY !!!!!", "cyan")
            await notify_group(self.channel_layer, 'lobby', event, content)

    async def notify_room(self, room_id: str, event: str, content: Dict[str, Any]) -> None:
        # Printer.log(f"!!!!! notify ROOM {room_id} !!!!!", "cyan")
        if self.channel_layer:
            await notify_group(self.channel_layer, room_id, event, content)

    # Test Methods
    def make_test_rooms(self):
        self.create_test_room('human_vs_human', '인간 vs 인간', 'human', 'human', 1, 1)
        self.enter_test_client('human_vs_human', 'test1', '인간봇', None, 'human')
        self.change_client_ready_state('human_vs_human', 'test1', 'READY')
        
        self.create_test_room('vam_vs_humans_jiantBlocker', '뱀파이어 : 자이언트블로커', 'vampire', 'human', 1, 1)
        self.enter_test_client('vam_vs_humans_jiantBlocker', 'jiantBlocker', '자이언트블로커', None, 'jiantBlocker')
        self.change_client_ready_state('vam_vs_humans_jiantBlocker', 'jiantBlocker', 'READY')

        self.create_test_room('vam_vs_humans_illusionFaker', '뱀파이어 : 일루전페이커', 'vampire', 'human', 1, 1)
        self.enter_test_client('vam_vs_humans_illusionFaker', 'illusionFaker', '일루전페이커', None, 'illusionFaker')
        self.change_client_ready_state('vam_vs_humans_illusionFaker', 'illusionFaker', 'READY')

        self.create_test_room('vam_vs_humans_speedTwister', '뱀파이어 : 스피드 트위스터', 'vampire', 'human', 1, 1)
        self.enter_test_client('vam_vs_humans_speedTwister', 'speedTwister', '스피드트위스터', None, 'speedTwister')
        self.change_client_ready_state('vam_vs_humans_speedTwister', 'speedTwister', 'READY')

        self.create_test_room('vam_vs_humans_ghostSmasher', '뱀파이어 : 고스트 스매셔', 'vampire', 'human', 1, 1)
        self.enter_test_client('vam_vs_humans_ghostSmasher', 'ghostSmasher', '고스트스매셔', None, 'ghostSmasher')
        self.change_client_ready_state('vam_vs_humans_ghostSmasher', 'ghostSmasher', 'READY')


    
    def create_test_room(self, room_id, title, left_mode, right_mode, left_max_count, right_max_count):
        self.rooms[room_id] = GameRoomManager(self.channel_layer, room_id, title, left_mode, right_mode, left_max_count, right_max_count, 'normal')

    def enter_test_client(self, room_id, client_id, nickname, uri, ability):
        game_manager = self.rooms.get(room_id, None)
        game_manager.enter_room(client_id, nickname, uri)
        game_manager.set_client_ability(client_id, ability)
        