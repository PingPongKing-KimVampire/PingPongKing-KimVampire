class GameRoomNotifier:
    def __init__(self, channel_layer, room_id, ball):
        self.channel_layer = channel_layer
        self.room_id = room_id
        self.ball = ball
        
    async def broadcast_ball_location_update(self):
        if self.ball.is_vanish:
            if self.ball.dx < 0:
                room_id_team = f"{self.room_id}-right"
            else:
                room_id_team = f"{self.room_id}-left"
        else:
            room_id_team = self.room_id

        await self.broadcast_group(room_id_team, 'notifyBallLocationUpdate', 
            {'xPosition': self.ball.pos_x, 'yPosition': self.ball.pos_y})

    async def broadcast(self, event, content={}):
        await self.channel_layer.group_send(
            self.room_id,
            {
                'type': event,
                'content': content
            }
        )

    async def broadcast_group(self, group, event, content={}):
        await self.channel_layer.group_send(
            group,
            {
                'type': event,
                'content': content
            }
        )