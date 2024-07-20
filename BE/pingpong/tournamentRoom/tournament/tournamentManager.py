import asyncio
import uuid
import random
from pingpongRoom.gameManage.gameRoomManager import GameRoomManager
from coreManage.group import add_group, discard_group, notify_group

class TournamentManager:
    def __init__(self, stateManager, channel_layer, room_id, consumers):
        self.stateManager = stateManager
        self.channel_layer = channel_layer
        self.room_id = room_id
        # "consumers = { client_id : consumer }"
        self.consumers = {} 
        for consumer in consumers:
            self.consumers[consumer.client_id] = consumer

        # "clientInfo" : { id : str, nickname : str, avartaUrl : str}
        self.client_info_list = []
        for consumer in consumers:
            self.client_info_list.append({
                'id': consumer.client_id,
                'nickname': consumer.nickname,
                'avatarUrl': consumer.avatar_url
            })
            # print('id:', consumer.client_id)
            # print('nickname:', consumer.nickname)
            # print('avatarUrl: ', consumer.avatar_url)

        self.tournament_state = "semiFinal" # semiFinal, final
        self.tournament_info_list = {
            'semiFinal' : None,
            'final' : None
        }
        self.game_manager_list = {
            'semiFinal' : None,
            'final' : None
        }
        self.semi_final_winners = []
        self.make_semi_final_rooms()
        self.make_final_room()

    def get_client_info_list(self):
        return self.client_info_list

    def get_game_room_id_now(self, client_id, client_state):
        for gameroom_info in self.tournament_info_list[client_state]:
            for id in gameroom_info['clientIdList']:
                if client_id == id:
                    return gameroom_info['roomId']
        return None

    def get_tournament_info_list(self):
        return self.tournament_info_list

    def change_tournamanet_info_game_state(self, tournament_state, room_id, winner_id, state):
        for gameroom_info in self.tournament_info_list[tournament_state]:
            if room_id == gameroom_info['roomId']:
                gameroom_info['state'] = state
                gameroom_info['winnerId'] = winner_id
                break

    def add_semi_final_winner(self, client_id):
        for client_info in self.client_info_list:
            if client_id == client_info['id']:
                self.semi_final_winners.append(client_info)
                print(self.semi_final_winners.__len__())
                break

    def is_ready_final_room(self):
        if self.semi_final_winners.__len__() == 2:
            return self.enter_final_room()
        return None

    def make_semi_final_rooms(self):
        room_id_1, game_manager_1 = self.make_game_room()
        room_id_2, game_manager_2 = self.make_game_room()
        self.game_manager_list['semiFinal'] = [game_manager_1, game_manager_2]

        semi_final_arr = []
        for i in range(2):
            client_1 = self.client_info_list[2 * i]
            client_2 = self.client_info_list[2 * i + 1]
            room_id = room_id_1 if i == 0 else room_id_2
            game_manager = game_manager_1 if i == 0 else game_manager_2
            semi_final_arr.append(self.set_game_room_data(client_1, client_2, room_id, game_manager))
            self.stateManager.rooms[room_id] = game_manager
        self.tournament_info_list['semiFinal'] = semi_final_arr

    def make_final_room(self):
        room_id, game_manager = self.make_game_room()
        self.game_manager_list['final'] = game_manager
        self.tournament_info_list['final'] = [{
            'clientIdList' : [],
            'score' : [0,0],
            'winnerId' : None,
            'roomId' : room_id,
            'state' : 'notStarted'
        }]
        self.stateManager.rooms[room_id] = game_manager
        
    def get_final_room_data(self):
        game_manager = self.game_manager_list['final']
        room_id = self.tournament_info_list['final'][0]['roomId']
        return room_id, game_manager
    
    def enter_final_room(self):
        room_id, game_manager = self.get_final_room_data()
        client_1 = self.semi_final_winners[0]
        client_2 = self.semi_final_winners[1]
        self.tournament_info_list['final'][0] = self.set_game_room_data(client_1, client_2, room_id, game_manager)
        print(self.tournament_info_list['final'])
        return room_id

    def set_game_room_data(self, client_1, client_2, room_id, game_manager):
        data = {
            'clientIdList' : [client_1['id'], client_2['id']],
            'score' : [0,0],
            'winnerId' : None,
            'roomId' : room_id,
            'state' : 'notStarted'
        }
        game_manager.enter_room(client_1['id'], client_1['nickname'], client_1['avatarUrl'])
        game_manager.enter_room(client_2['id'], client_2['nickname'], client_2['avatarUrl'])
        return data

    def make_game_room(self):
        game_room_id = str(uuid.uuid4())
        game_room_manager = GameRoomManager(self.channel_layer, game_room_id, f"tournament_{game_room_id}")
        return game_room_id, game_room_manager

    def update_room_score(self, state, room_id, team, score):
        for gameroom_info in self.tournament_info_list[state]:
            if gameroom_info['roomId'] == room_id:
                if team == 'left':
                    gameroom_info['score'][0] = score
                else:
                    gameroom_info['score'][1] = score
                break

    async def notify_all_team_finish(self, consumer, tournament_state):
        await self.notify_tournament_room("notifyAllTeamFinish", {"stage": tournament_state})
        if consumer.tournament_state == "final":
            asyncio.create_task(self.start_final_room())

    async def start_final_room(self):
        self.tournament_state = 'final'
        room_id = self.tournament_info_list['final'][0]['roomId']
        await asyncio.sleep(10)
        data = {
            'pingpongroomId' : room_id,
            'stage' : self.tournament_state
        }
        await notify_group(self.channel_layer, f"tournament_{room_id}", 
                           "notifyYourGameRoomReady", data)
    
    async def notify_tournament_room(self, event, content):
        await self.channel_layer.group_send(
            self.room_id,
            {
                'type': event,
                'content': content
            }
        )