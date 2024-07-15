import asyncio
import uuid
import random
from pingpongRoom.gameManage.gameRoomManager import GameRoomManager
from coreManage.group import add_group, discard_group, notify_group

class TournamentManager:
    def __init__(self, channel_layer, room_id, consumers):
        self.channel_layer = channel_layer
        self.room_id = room_id
        # "consumers = { client_id : consumer }"
        self.consumers = {} 
        for consumer in consumers:
            self.consumers[consumer.client_id] = consumer

        # "clientInfo" : { clientId : str, nickname : str, imageUri : str}
        self.client_info_list = []
        for consumer in consumers:
            self.client_info_list.append({
                'clientId': consumer.client_id,
                'nickname': consumer.nickname,
                'imageUri': consumer.image_uri
            })

        self.tournament_state = "semi-final" # semi-final, final
        self.tournamnet_info_list = {
            'semi-final' : None,
            'final' : None
        }
        self.game_manager_list = {
            'semi-final' : None,
            'final' : None
        }
        self.make_semi_final_rooms()

    def get_client_info_list(self):
        return self.client_info_list

    def get_game_room_id_now(self, client_id, client_state):
        for gameroom_info in self.tournamnet_info_list[client_state]:
            for id in gameroom_info['clientIdList']:
                if client_id == id:
                    return gameroom_info['roomId']
        return None

    def make_semi_final_rooms(self):
        room_id_1, game_manager_1 = self.make_game_room()
        room_id_2, game_manager_2 = self.make_game_room()
        self.game_manager_list['semi-final'] = [game_manager_1, game_manager_2]

        semi_final_arr = []
        for i in range(2):
            client_1_id = self.client_info_list[i]['clientId']
            client_2_id = self.client_info_list[i + 1]['clientId']
            if i == 0:
                room_id = room_id_1
            elif i == 1:
                room_id = room_id_2
            semi_final_arr.append({
                'clientIdList' : [client_1_id, client_2_id],
                'score' : [0,0],
                'roomId' : room_id,
                'state' : 'notStarted'
            })
        self.tournamnet_info_list['semi-final'] = semi_final_arr

    def make_final_room(self):
        room_id, game_manager = self.make_game_room()
        self.game_manager_list['final'] = game_manager
        
        

    def make_game_room(self):
        game_room_id = str(uuid.uuid4())
        game_room_manager = GameRoomManager(self.channel_layer, game_room_id, f"tournament_{game_room_id}")
        return game_room_id, game_room_manager

    def trigger_tournament(self):
        asyncio.create_task(self.tournament_loop())

    async def tournament_loop(self):
        while not self.is_end:
            await self.tournament_round()
            await asyncio.sleep(5)
        await self.end_tournament()

    async def notify_your_game_room_ready(self, game_room_id):
        pass