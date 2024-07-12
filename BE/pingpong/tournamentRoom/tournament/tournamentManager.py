import asyncio
import uuid
import random
from pingpongRoom.gameManage.gameRoomManager import GameRoomManager

class TournamentManager:
    def __init__(self, channel_layer, room_id, client_list):
        self.channel_layer = channel_layer
        self.room_id = room_id
        self.clients = client_list #(client_id : nickname)
        self.state = "semi-final" # semi-final, final
        self.game_room_list = []

    def make_pingpong_room(self):
        pass

    def trigger_tournament(self):
        asyncio.create_task(self.tournament_loop())
        
    async def tournament_loop(self):
        while not self.is_end:
            await self.tournament_round()
            await asyncio.sleep(5)
        await self.end_tournament()