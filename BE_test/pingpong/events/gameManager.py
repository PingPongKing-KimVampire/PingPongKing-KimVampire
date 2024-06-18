import asyncio
import random
from .ball import Ball
from .player import Player
from utils.group import notify_group

FRAME_PER_SECOND = 60

LEFT = 0
RIGHT = 1

class GameManager:
    def __init__(self, room_id):
        self.room_id = room_id
        self.left_team = []
        self.right_team = []
        self.waiting_clients = []
        self.board_width = 1550
        self.board_height = 1000
        self.ball_radius = 25
        self.ball = Ball(2, self.ball_radius)
        self.is_playing = False
        self.is_end = False
        self.round_count = 0
        self.serve_turn = LEFT  # 서브 턴 초기 설정
        
    def set_teams(self, left_team, right_team):
        self.left_team = left_team
        self.right_team = right_team
        team_width = self.board_width / 8
        for player in self.left_team:
            player.team = LEFT
            player.update_pos(team_width, self.board_height / 2)
        for player in self.right_team:
            player.team = RIGHT
            player.update_pos(self.board_width - team_width, self.board_height / 2)
        
    async def start_game(self, consumer):
        self.is_playing = True
        self.is_end = False
        self.round_count = 0
        self.reset_round()
        await notify_group(consumer, self.room_id, event='notifyGameStart', content={})
        await self._game_loop(consumer)

    async def _game_loop(self, consumer):
        while self.is_playing and not self.is_end:
            self.ball.move()
            self._detect_collisions()
            await self._send_ball_update(consumer)
            await asyncio.sleep(1 / FRAME_PER_SECOND)

    def _detect_collisions(self):
        if self.ball.get_right_x() >= self.board_width:
            self.serve_turn = LEFT
            self._end_round()
        elif self.ball.get_left_x() <= 0:
            self.serve_turn = RIGHT
            self._end_round()
        elif self.ball.get_top_y() <= 0 or self.ball.get_bottom_y() >= self.board_height:
            self.ball.dy = -self.ball.dy
        else:
            self._detect_paddle_collision()

    def _detect_paddle_collision(self):
        players_to_check = self.right_team if self.ball.dx > 0 else self.left_team
        for player in players_to_check:
            if self._is_ball_colliding_with_paddle(player):
                self.ball.change_direction(random.randint(-45, 45))
                break

    def _is_ball_colliding_with_paddle(self, player):
        if (self.ball.yPos >= player.posY - player.paddle_height / 2 and
                self.ball.yPos <= player.posY + player.paddle_height / 2):
            if (self.ball.dx > 0 and self.ball.get_right_x() >= player.posX - player.paddle_width / 2) or \
               (self.ball.dx < 0 and self.ball.get_left_x() <= player.posX + player.paddle_width / 2):
                return True
        return False

    async def _send_ball_update(self, consumer):
        await notify_group(consumer, self.room_id, event='notifyBallLocationUpdate', content={
            'xPosition': self.ball.xPos,
            'yPosition': self.ball.yPos
        })

    def _end_round(self):
        self.round_count += 1
        self.reset_round()
        # Add logic here to notify players about the round end, update scores, etc.

    def reset_round(self):
        serve_position = self.board_width / 4 if self.serve_turn == LEFT else 3 * self.board_width / 4
        self.ball.reset_ball(serve_position, self.board_height / 2, 0)
        
        # Reset paddles positions
        team_width = self.board_width / 8
        for player in self.left_team:
            player.update_pos(team_width, self.board_height / 2)
        for player in self.right_team:
            player.update_pos(self.board_width - team_width, self.board_height / 2)

    def end_game(self):
        self.is_playing = False
        self.is_end = True
