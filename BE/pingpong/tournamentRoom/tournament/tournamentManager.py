import asyncio
import uuid
import random
from pingpongRoom.gameManage.gameRoomManager import GameRoomManager
from coreManage.group import add_group, discard_group, notify_group

class TournamentManager:
    def __init__(self, channel_layer, room_id, client_info_list):
        self.channel_layer = channel_layer
        self.room_id = room_id
        # client_info_list = [{clientId : str, nickname : str, imageUri : str}]
        self.client_info_list = client_info_list
        self.tournament_state = "semi-final" # semi-final, final
        self.game_room_list = {}

    def get_client_info_list(self):
        return self.client_info_list

    def make_game_room(self, client1, client2):
        game_room_id = str(uuid.uuid4())
        self.game_room_list[game_room_id] = GameRoomManager(self.channel_layer, game_room_id, client1, client2)
        return game_room_id

    def trigger_tournament(self):
        asyncio.create_task(self.tournament_loop())

    async def tournament_loop(self):
        while not self.is_end:
            await self.tournament_round()
            await asyncio.sleep(5)
        await self.end_tournament()

    async def notify_your_game_room_ready(self, game_room_id):
        pass