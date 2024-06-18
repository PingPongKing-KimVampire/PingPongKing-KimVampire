from typing import Any
import uuid
from utils.group import add_group, discard_group, change_group, notify_group
from .gameManager import GameManager

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

    ### Client
    async def _add_client(self, consumer, clientId, nickname):
        self.clients[clientId] = nickname
        await add_group(consumer, 'lobby')

    async def _remove_client(self, consumer, clientId):
        if clientId in self.clients:
            del self.clients[clientId]
        await discard_group(consumer, 'lobby')

    ### Room
    async def _create_room(self, consumer, clientId, content):
        roomId = str(uuid.uuid4())
        while roomId in self.rooms:
            roomId = str(uuid.uuid4())
        self.rooms[roomId] = {
            'title': content['title'],
            'leftMode': content['leftMode'],
            'rightMode': content['rightMode'],
            'leftMaxPlayerCount': content['leftPlayerCount'],
            'rightMaxPlayerCount': content['rightPlayerCount'],
            'teamLeft': {},
            'teamRight': {},
            'gameManager': GameManager(roomId)
        }
        return roomId

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
        await change_group(consumer, old_group='lobby', new_group=room_id)
        await self._add_client_to_room(consumer, room_id, client_id, team)
        return True
        
    async def _leave_waiting_room(self, consumer, room_id, client_id):
        self._remove_player_from_room(room_id, client_id)
        # 무조건 lobby로 그룹 변경이 맞는가?
        await change_group(consumer, old_group=room_id, new_group='lobby')
        await notify_group(consumer, room_id, 
                           event='notifyWaitingRoomExit', 
                           content={'clientId': client_id})

    async def _add_client_to_room(self, consumer, room_id, client_id, team):
        room = self.rooms[room_id]
        count = len(room['teamLeft']) + len(room['teamRight'])
        client_nickname = self.clients[client_id]
        room[team][client_id] = {
            'nickname': client_nickname,
            'state': 'NOTREADY'
        }
        if count == 0:
            await notify_group(consumer, 'lobby', 
                               event='notifyWaitingRoomCreated', 
                               content={'roomId': room_id})
        await notify_group(consumer, 'lobby', 
                           event='notifyCurrentPlayerCountChange', 
                           content={'clientId': client_id, 'currentPlayerCount': count + 1})
        await notify_group(consumer, room_id, 
                           event='notifyWaitingRoomEnter', 
                           content={'clientId': client_id, 'clientNickname': client_nickname, 'team': team})

    def _remove_player_from_room(self, room_id, client_id):
        if room_id in self.rooms:
            for team in ['teamLeft', 'teamRight']:
                if client_id in self.rooms[room_id][team]:
                    del self.rooms[room_id][team][client_id]
                    break

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
                room[team][client_id]['state'] = 'READY' if is_ready else 'NOTREADY'
                break
        await notify_group(consumer, room_id, 
                           event='notifyReadyStateChange', 
                           content={'clientId': client_id, 'isReady': is_ready})
        await self._check_game_ready(consumer, room_id)
            
    async def _check_game_ready(self, consumer, room_id):
        room = self.rooms[room_id]
        team_left_ready = all([info['state'] == 'READY' for info in room['teamLeft'].values()])
        team_right_ready = all([info['state'] == 'READY' for info in room['teamRight'].values()])
        if team_left_ready and team_right_ready:
            await notify_group(consumer, room_id, 
                               event='notifyGameReady', 
                               content={})
            await self._start_game(consumer, room_id)

    async def _start_game(self, consumer, room_id):
        game_manager = self.rooms[room_id]['gameManager']
        await notify_group(consumer, room_id, 
                           event='notifyGameStart', 
                           content={})
        left_team = [player for player in self.rooms[room_id]['teamLeft'].keys()]
        right_team = [player for player in self.rooms[room_id]['teamRight'].keys()]
        game_manager.set_teams(left_team, right_team)
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
