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
#                         left, right, 
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
        
    async def clear_group(self, group_name):
        if group_name in self.channel_layer.groups:
            for client_id, channel_name in self.clients.items():
                await discard_group(channel_name, group_name)
                Printer.log(f"Cleared group {group_name} for client {client_id}", "yellow")

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
    
    def _get_client_nickname(self, clientId):
        return self.clients[clientId]

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
            'left': {},
            'right': {},
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
        if len(room['left']) < room['leftMaxPlayerCount']:
            team = 'left'
        elif len(room['right']) < room['rightMaxPlayerCount']:
            team = 'right'
        else:
            return False
        await add_group(consumer, room_id)
        room_id_team = f"{room_id}-{team}"
        await add_group(consumer, room_id_team)
        await discard_group(consumer, 'lobby')
        await self._add_client_to_room(room_id, client_id, team)
        return True
        
    async def _leave_waiting_room(self, consumer, room_id, client_id):
        await self._remove_player_from_room(consumer, room_id, client_id)
        await discard_group(consumer, room_id)
        await self._notify_room(room_id, event='notifyWaitingRoomExit', content={'clientId': client_id})

    async def _add_client_to_room(self, room_id, client_id, team):
        room = self.rooms[room_id]
        count = len(room['left']) + len(room['right'])
        client_nickname = self.clients[client_id]
        room[team][client_id] = {
            'nickname': client_nickname,
            'state': 'NOTREADY',
            'ability': 'human'
        }
        if count == 0:
            room_data = { "waitingRoomInfo": {
                    'roomId': room_id,
                    'title': room['title'],
                    'leftMode': room['leftMode'],
                    'rightMode': room['rightMode'],
                    'currentPlayerCount': count + 1,
                    'totalPlayerCount': room['leftMaxPlayerCount'] + room['rightMaxPlayerCount'],
                }
            }
            await self._notify_lobby('notifyWaitingRoomCreated', room_data)
        else:
            await self._notify_lobby(event='notifyCurrentPlayerCountChange', content={'currentPlayerCount': count + 1, 'roomId': room_id})
        enter_data = { 'clientId': client_id, 'clientNickname': client_nickname, 'team': team }
        await self._notify_room(room_id, event='notifyWaitingRoomEnter', content=enter_data)

    async def _remove_player_from_room(self, consumer, room_id, client_id):
        if room_id in self.rooms:
            for team in ['left', 'right']:
                if client_id in self.rooms[room_id][team]:
                    del self.rooms[room_id][team][client_id]
                    room_id_team = f"{room_id}-{team}"
                    await discard_group(consumer, room_id_team)
                    break
            if len(self.rooms[room_id]['left']) + len(self.rooms[room_id]['right']) == 0:
                del self.rooms[room_id]
                room_id_left, room_id_right = f"{room_id}-left", f"{room_id}-right"
                await self.clear_group(room_id_left)
                await self.clear_group(room_id_right)
                await self._notify_lobby('notifyWaitingRoomClosed', {'waitingRoomInfo' : { 'roomId': room_id} })
            else:
                count = len(self.rooms[room_id]['left']) + len(self.rooms[room_id]['right'])
                await self._notify_lobby('notifyCurrentPlayerCountChange', {'currentPlayerCount': count, 'roomId': room_id})

    async def _get_waiting_room_list(self):
        room_data = []
        for roomId, room in self.rooms.items():
            current_players = len(room['left']) + len(room['right'])
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
        for team in ['left', 'right']:
            if client_id in room[team]:
                room[team][client_id]['state'] = is_ready
                break
        await self._notify_room(room_id, event='notifyReadyStateChange', content={'clientId': client_id, 'state': is_ready})
        asyncio.sleep(0.1)
        if await self._check_room_full(room_id):
            await self._check_game_ready(consumer, room_id)

    async def _select_ability(self, room_id, client_id, ability):
        room = self.rooms[room_id]
        for team in ['left', 'right']:
            if client_id in room[team]:
                room[team][client_id]['ability'] = ability
                break
        await self._notify_room(room_id, event='notifySelectAbility', content={'team': team,  'ability': ability})
        Printer.log(f"Client {client_id} selected ability {ability}", "blue")
    
    async def _check_game_ready(self, consumer, room_id):
        room = self.rooms[room_id]
        team_left_ready = all([info['state'] == 'READY' for info in room['left'].values()])
        team_right_ready = all([info['state'] == 'READY' for info in room['right'].values()])
        if team_left_ready and team_right_ready:
            Printer.log(f"Both teams are ready in room {room_id}. Notifying game ready.", "green")
            await self._start_game(consumer, room_id)


    async def _start_game(self, consumer, room_id):
        game_manager = self.rooms[room_id]['gameManager']
        game_manager.set_game_manager(self.rooms[room_id], consumer)
        await self._notify_lobby('notifyWaitingRoomClosed', {'waitingRoomInfo' : {'roomId': room_id}})
        await game_manager.trigger_game()

    async def _get_waiting_room_player_list(self, room_id):
        team_left_list = []
        team_right_list = []
        room = self.rooms[room_id]
        for client_id, info in room['left'].items():
            team_left_list.append({
                'clientId': client_id,
                'clientNickname': info['nickname'],
                'readyState': info['state']
            })
        for client_id, info in room['right'].items():
            team_right_list.append({
                'clientId': client_id,
                'clientNickname': info['nickname'],
                'readyState': info['state']
            })
        return team_left_list, team_right_list

    async def _check_room_full(self, room_id):
        room = self.rooms[room_id]
        return len(room['left']) + len(room['right']) == room['leftMaxPlayerCount'] + room['rightMaxPlayerCount']