from typing import Any
import uuid
from .group import add_group, discard_group, notify_group
from pingpongRoom.gameManage.gameManager import GameManager
import asyncio
from utils.printer import Printer

#   StateManager
#   1. 클라이언트 관리 : clients: { clientId: nickname }
#   2. Room 관리 : rooms: { roomId: { title, leftMode, rightMode, 
#                         leftMaxPlayerCount, rightMaxPlayerCount, 
#                         teamLeft, teamRight, 
#                         gameManager, state } }
#   3. lobby_channel: channel_layer
#   4. 그룹 관리 : add_group, discard_group, notify_group


class StateManager:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(StateManager, cls).__new__(cls, *args, **kwargs)
            cls._instance._init()
        return cls._instance

    def _init(self):
        self.clients = {}
        self.rooms = {}

    async def _notify_lobby(self, event, content):
        Printer.log(f"!!!!! notify LOBBY !!!!!", "cyan")
        await notify_group(self.lobby_channel, 'lobby', event, content)

    async def _notify_room(self, room_id, event, content):
        Printer.log(f"!!!!! notify ROOM {room_id} !!!!!", "cyan")
        await notify_group(self.lobby_channel, room_id, event, content)

    ### Client
    async def _add_client(self, consumer, clientId, nickname):
        if self.clients.__len__() == 0:
            self.lobby_channel = consumer.channel_layer
        self.clients[clientId] = nickname
        await add_group(consumer, 'lobby')

    async def _remove_client(self, consumer, clientId):
        if clientId in self.clients:
            del self.clients[clientId]
        await discard_group(consumer, 'lobby')

    ### Room
    async def _create_room(self, content):
        room_id = str(uuid.uuid4())
        while room_id in self.rooms:
            room_id = str(uuid.uuid4())
        self.rooms[room_id] = {
            'title': content['title'],
            'leftMode': content['leftMode'],
            'rightMode': content['rightMode'],
            'leftMaxPlayerCount': content['leftPlayerCount'],
            'rightMaxPlayerCount': content['rightPlayerCount'],
            'teamLeft': {},
            'teamRight': {},
            'gameManager': GameManager(room_id, content['leftMode'], content['rightMode']),
            'state': 'waiting'
        }
        Printer.log(f"Room {room_id} created", "blue")
        Printer.log(self.rooms[room_id])
        return room_id

    async def _enter_waiting_room(self, consumer, room_id, client_id):
        if room_id not in self.rooms:
            return False
        room = self.rooms[room_id]
        if len(room['teamLeft']) < room['leftMaxPlayerCount']:
            team = 'teamLeft'
        elif len(room['teamRight']) < room['rightMaxPlayerCount']:
            team = 'teamRight'
        else:
            return False
        await add_group(consumer, room_id)
        await discard_group(consumer, 'lobby')
        await self._add_client_to_room(room_id, client_id, team)
        return True
        
    async def _leave_waiting_room(self, consumer, room_id, client_id):
        await self._remove_player_from_room(consumer, room_id, client_id)
        await discard_group(consumer, room_id)
        await self._notify_room(room_id, 
                           event='notifyWaitingRoomExit', 
                           content={'clientId': client_id})

    async def _add_client_to_room(self, room_id, client_id, team):
        room = self.rooms[room_id]
        count = len(room['teamLeft']) + len(room['teamRight'])
        client_nickname = self.clients[client_id]
        room[team][client_id] = {
            'nickname': client_nickname,
            'state': 'NOTREADY',
            'ability': 'human'
        }
        data = { 'clientId': client_id, 'clientNickname': client_nickname, 'team': team }
        if count == 0:
            await self._notify_lobby('notifyWaitingRoomCreated', {'roomId': room_id})
        await self._notify_room(room_id, event='notifyCurrentPlayerCountChange', content={'currentPlayerCount': count + 1})
        await self._notify_room(room_id, event='notifyWaitingRoomEnter', content=data)

    async def _remove_player_from_room(self, consumer, room_id, client_id):
        if room_id in self.rooms:
            for team in ['teamLeft', 'teamRight']:
                if client_id in self.rooms[room_id][team]:
                    del self.rooms[room_id][team][client_id]
                    break
            if len(self.rooms[room_id]['teamLeft']) + len(self.rooms[room_id]['teamRight']) == 0:
                del self.rooms[room_id]
                await self._notify_lobby('notifyWaitingRoomClosed', {'waitingRoomInfo' : { 'roomId': room_id} })

    async def _get_waiting_room_list(self):
        room_data = []
        for roomId, room in self.rooms.items():
            current_players = len(room['teamLeft']) + len(room['teamRight'])
            max_player_count = room['leftMaxPlayerCount'] + room['rightMaxPlayerCount']
            room_data.append({
                'roomId': roomId,
                'title': room['title'],
                'leftMode': room['leftMode'],
                'rightMode': room['rightMode'],
                'currentPlayerCount': current_players,
                'maxPlayerCount': max_player_count
            })
        return room_data
    
    async def _change_ready_state(self, consumer, room_id, client_id, is_ready):
        room = self.rooms[room_id]
        for team in ['teamLeft', 'teamRight']:
            if client_id in room[team]:
                room[team][client_id]['state'] = is_ready
                break
        await self._notify_room(room_id, event='notifyReadyStateChange', content={'clientId': client_id, 'state': is_ready})
        if self._check_room_full(room_id):
            await self._check_game_ready(consumer, room_id)
            
    async def _check_game_ready(self, consumer, room_id):
        room = self.rooms[room_id]
        team_left_ready = all([info['state'] == 'READY' for info in room['teamLeft'].values()])
        team_right_ready = all([info['state'] == 'READY' for info in room['teamRight'].values()])
        if team_left_ready and team_right_ready:
            await self._notify_room(room_id, event='notifyGameReady', content={})
            asyncio.sleep(3)
            await self._start_game(consumer, room_id)

    async def _start_game(self, consumer, room_id):
        game_manager = self.rooms[room_id]['gameManager']
        await game_manager.set_team(self.rooms[room_id])
        await self._notify_room(room_id, event='notifyGameStart', content={})
        await self._notify_lobby('notifyWaitingRoomClosed', {'roomId': room_id})
        game_manager.start_game(consumer)

    async def _get_waiting_room_player_list(self, room_id):
        team_left_list = []
        team_right_list = []
        room = self.rooms[room_id]
        for client_id, info in room['teamLeft'].items():
            team_left_list.append({
                'clientId': client_id,
                'clientNickname': info['nickname'],
                'readyState': info['state']
            })
        for client_id, info in room['teamRight'].items():
            team_right_list.append({
                'clientId': client_id,
                'clientNickname': info['nickname'],
                'readyState': info['state']
            })
        return team_left_list, team_right_list

    def _check_room_full(self, room_id):
        room = self.rooms[room_id]
        return len(room['teamLeft']) + len(room['teamRight']) == room['leftMaxPlayerCount'] + room['rightMaxPlayerCount']