from typing import Dict, Any, Optional, List, Tuple
import uuid
from asyncio import sleep, create_task
import asyncio
from .group import notify_group, add_group
from pingpongRoom.gameManage.gameManager import GameManager
from utils.printer import Printer

class StateManager:
    _instance: Optional['StateManager'] = None

    def __new__(cls) -> 'StateManager':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self) -> None:
        self.channel_layer = None
        self.clients: Dict[str, str] = {}
        self.rooms: Dict[str, Dict[str, Any]] = {}
        self.match_making_loop_task = None
        self.match_queue = []
        self.tournaments = {str, Dict[str, Any]}
        self.is_match_task_running = False

    # Matchmaking Management
    def add_to_match_queue(self, consumer) -> None:
        if self.match_making_loop_task is None or self.match_making_loop_task.done():
            self.is_match_task_running = True
            self.match_making_loop_task = create_task(self.match_making_loop())
        self.match_queue.append(consumer)
        Printer.log(f"Client {consumer.client_id} added to match queue", "blue")

    def remove_from_match_queue(self, consumer) -> None:
        self.match_queue.remove(consumer)
        Printer.log(f"Client {consumer.client_id} removed from match queue", "blue")

    def is_match_queue_full(self) -> bool:
        return len(self.match_queue) >= 4

    async def group_match_clients(self, match_clients, tournament_id) -> None:
        for consumer in match_clients:
            await asyncio.gather(*[add_group(consumer, tournament_id)]) # gather : 병렬적으로 실행하지만, 순서는 보장됨
            await notify_group(self.channel_layer, tournament_id, 
                               'notifyMatchMakingComplete', {'tournamentId': tournament_id})

    async def match_making_loop(self) -> None:
        while self.is_match_task_running:
            if self.is_match_queue_full():
                match_clients = self.match_queue[:4]
                self.match_queue = self.match_queue[4:]
                client_list = {consumer.client_id: consumer.nickname for consumer in match_clients}
                tournament_id = self.create_tournament(client_list)
                await self.group_match_clients(match_clients, tournament_id)
            if not self.match_queue:
                self.is_match_task_running = False
            await sleep(1)
        self.match_making_loop_task = None

    def create_tournament(self, client_list) -> str:
        tournament_id = str(uuid.uuid4())
        self.tournaments[tournament_id] = {
            'clients': client_list,
            'state': 'semi-final',
            'gameData' : Dict[str, Any] # row : [gameinfo, gameinfo]
        }
        return tournament_id

    async def stop_matchmaking(self):
        self.is_match_task_running = False
        if self.match_making_loop_task:
            await self.match_making_loop_task
            
    def set_tournament_room_state(self, tournament_id: str, state: str) -> None:
        self.tournaments[tournament_id]['state'] = state
        
    def get_tournament_room_state(self, tournament_id: str) -> str:
        return self.tournaments.get(tournament_id, {}).get('state', '')

    def get_tournament_game_data(self, tournament_id: str) -> Dict[str, Any]:
        return self.tournaments.get(tournament_id, {}).get('gameData', {})

    def append_tournament_game_data(self, tournament_id: str, data: Dict[str, Any]) -> None:
        self.tournaments[tournament_id]['gameData'].append(data)

    # Tournament Management

    def get_tournament_room(self, tournament_id: str) -> Dict[str, Any]:
        return self.tournaments.get(tournament_id, {})
    
    def get_tournament_client_list(self, tournament_id: str) -> List[Dict[str, str]]:
        return self.tournaments.get(tournament_id, {}).get('clients', {})

    # Client Management
    def add_client(self, consumer: Any, client_id: str, nickname: str) -> None:
        if self.channel_layer is None:
            self.channel_layer = consumer.channel_layer
        self.clients[client_id] = nickname

    def remove_client(self, client_id: str) -> None:
        self.clients.pop(client_id, None)

    def get_client_nickname(self, client_id: str) -> str:
        return self.clients.get(client_id, '')

    # Room Management
    def create_room(self, content: Dict[str, Any]) -> str:
        room_id = str(uuid.uuid4())
        while room_id in self.rooms:
            room_id = str(uuid.uuid4())
        
        self.rooms[room_id] = {
            'title': content['title'],
            'leftMode': content['leftMode'],
            'rightMode': content['rightMode'],
            'leftAbility': None,
            'rightAbility': None,
            'leftMaxPlayerCount': content['leftPlayerCount'],
            'rightMaxPlayerCount': content['rightPlayerCount'],
            'left': {},
            'right': {},
            'gameManager': GameManager(room_id, content['leftMode'], content['rightMode'], self.channel_layer),
            'state': 'waiting'
        }
        Printer.log(f"Room {room_id} created", "blue")
        return room_id

    def is_room_empty(self, room_id: str) -> bool:
        return self.get_room_client_count(room_id) == 0

    def get_room_client_count(self, room_id: str) -> int:
        room = self.rooms.get(room_id, {})
        return len(room.get('left', {})) + len(room.get('right', {}))

    def get_room_ability(self, room_id: str) -> Dict[str, str]:
        left_ability = self.rooms[room_id].get('leftAbility', None)
        right_ability = self.rooms[room_id].get('rightAbility', None)
        return left_ability, right_ability

    def enter_waiting_room(self, room_id: str, client_id: str) -> Optional[str]:
        room = self.rooms.get(room_id)
        if not room:
            return None
        
        if len(room['left']) < room['leftMaxPlayerCount']:
            team = 'left'
        elif len(room['right']) < room['rightMaxPlayerCount']:
            team = 'right'
        else:
            return None
        
        self._add_client_to_room(room_id, client_id, team)
        return team

    def _add_client_to_room(self, room_id: str, client_id: str, team: str) -> None:
        room = self.rooms[room_id]
        client_nickname = self.clients[client_id]
        room[team][client_id] = {
            'nickname': client_nickname,
            'state': 'NOTREADY',
        }

    def remove_client_from_room(self, room_id: str, client_id: str) -> None:
        room = self.rooms.get(room_id, {})
        for team in ['left', 'right']:
            if client_id in room.get(team, {}):
                del room[team][client_id]
                break

    def get_waiting_room_list(self) -> List[Dict[str, Any]]:
        return [
            {
                'roomId': room_id,
                'title': room['title'],
                'leftMode': room['leftMode'],
                'rightMode': room['rightMode'],
                'currentPlayerCount': len(room['left']) + len(room['right']),
                'maxPlayerCount': room['leftMaxPlayerCount'] + room['rightMaxPlayerCount']
            }
            for room_id, room in self.rooms.items()
        ]

    def get_waiting_room_player_list(self, room_id: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        room = self.rooms.get(room_id, {})
        
        def get_team_list(team: str) -> List[Dict[str, Any]]:
            return [
                {
                    'clientId': client_id,
                    'clientNickname': info['nickname'],
                    'readyState': info['state']
                }
                for client_id, info in room.get(team, {}).items()
            ]
        
        return get_team_list('left'), get_team_list('right')

    def check_game_ready(self, room_id: str) -> bool:
        room = self.rooms.get(room_id, {})
        if not self.is_room_full(room_id):
            return False
        return all(info['state'] == 'READY' for team in ['left', 'right'] for info in room.get(team, {}).values())

    def is_room_full(self, room_id: str) -> bool:
        room = self.rooms.get(room_id, {})
        return (len(room.get('left', {})) + len(room.get('right', {})) ==
                room.get('leftMaxPlayerCount', 0) + room.get('rightMaxPlayerCount', 0))

    # Asynchronous Methods
    async def notify_room_enter(self, room_id: str, client_id: str, team: str) -> None:
        client_nickname = self.get_client_nickname(client_id)
        enter_data = {'clientId': client_id, 'clientNickname': client_nickname, 'team': team}
        await self.notify_room(room_id, event='notifyWaitingRoomEnter', content=enter_data)

    async def leave_waiting_room(self, consumer: Any, room_id: str, client_id: str) -> None:
        self.remove_client_from_room(room_id, client_id)
        await self.notify_room(room_id, event='notifyWaitingRoomExit', content={'clientId': client_id})
        if self.is_room_empty(room_id):
            del self.rooms[room_id]
            await self.notify_lobby('notifyWaitingRoomClosed', {'waitingRoomInfo': {'roomId': room_id}})

    async def notify_room_change(self, room_id: str, count: int) -> None:
        room = self.rooms.get(room_id, {})
        if count == 0:
            room_data = {
                "waitingRoomInfo": {
                    'roomId': room_id,
                    'title': room.get('title', ''),
                    'leftMode': room.get('leftMode', ''),
                    'rightMode': room.get('rightMode', ''),
                    'currentPlayerCount': count + 1,
                    'totalPlayerCount': room.get('leftMaxPlayerCount', 0) + room.get('rightMaxPlayerCount', 0),
                }
            }
            await self.notify_lobby('notifyWaitingRoomCreated', room_data)
        else:
            await self.notify_lobby('notifyCurrentPlayerCountChange', {'currentPlayerCount': count, 'roomId': room_id})

    async def change_client_ready_state(self, room_id: str, client_id: str, is_ready: str) -> None:
        room = self.rooms.get(room_id, {})
        for team in ['left', 'right']:
            if client_id in room.get(team, {}):
                room[team][client_id]['state'] = is_ready
                break
        await self.notify_room(room_id, event='notifyReadyStateChange', content={'clientId': client_id, 'state': is_ready})
        await sleep(0.1)  # Consider removing if not necessary
        if self.check_game_ready(room_id):
            Printer.log(f"Both teams are ready in room {room_id}. Notifying game ready.", "green")
            await self.start_game(room_id)

    async def change_client_ability(self, room_id: str, client_id: str, ability: str) -> None:
        room = self.rooms.get(room_id, {})
        for team in ['left', 'right']:
            if client_id in room.get(team, {}):
                room[f"{team}Ability"] = ability
                await self.notify_room(room_id, event='notifySelectAbility', content={'team': team, 'ability': ability})
                Printer.log(f"Client {client_id} selected ability {ability}", "blue")
                break

    async def start_game(self, room_id: str) -> None:
        room = self.rooms.get(room_id, {})
        game_manager = room.get('gameManager')
        if game_manager:
            game_manager.set_players(room)
            await self.notify_lobby('notifyWaitingRoomClosed', {'waitingRoomInfo': {'roomId': room_id}})
            await game_manager.trigger_game()

    async def notify_lobby(self, event: str, content: Dict[str, Any]) -> None:
        # Printer.log(f"!!!!! notify LOBBY !!!!!", "cyan")
        if self.channel_layer:
            await notify_group(self.channel_layer, 'lobby', event, content)

    async def notify_room(self, room_id: str, event: str, content: Dict[str, Any]) -> None:
        # Printer.log(f"!!!!! notify ROOM {room_id} !!!!!", "cyan")
        if self.channel_layer:
            await notify_group(self.channel_layer, room_id, event, content)

    def create_test_room(self) -> None:
        self.rooms['human_human'] = {
            'title': '인간 vs 인간',
            'leftMode': 'human',
            'rightMode': 'human',
            'leftMaxPlayerCount': 1,
            'rightMaxPlayerCount': 1,
            'left': {},
            'right': {},
            'gameManager': GameManager('testRoom', 'human', 'human', None),
            'state': 'waiting'
        }
        Printer.log(f"Test Room created", "blue")