import asyncio
import random
from .ball import Ball
from .player import Player
from coreManage.group import notify_group
from utils.printer import Printer

FRAME_PER_SECOND = 60

LEFT = 'left'
RIGHT = 'right'

class GameManager:
    def __init__(self, room_id, left_mode, right_mode):
        self.room_id = room_id
        self.left_team = {}
        self.right_team = {}
        self.left_mode = left_mode
        self.right_mode = right_mode
        self.board_width = 1550
        self.board_height = 1000
        self.ball_radius = 25
        self.ball = Ball(2, self.ball_radius)
        self.is_playing = False
        self.is_end = False
        self.score = {LEFT: 0, RIGHT: 0}
        self.serve_turn = LEFT
    
    def remove_client_from_team(self, client_id):
        for team in [self.left_team, self.right_team]:
            for player in team:
                if player.client_id == client_id:
                    team.remove(player)
                    return

    async def set_team(self, room):
        team_left = room['teamLeft']
        team_right = room['teamRight']
        self.team_left = {client_id: Player(info['nickname'], info['ability']) for client_id, info in team_left.items()}
        self.team_right = {client_id: Player(info['nickname'], info['ability']) for client_id, info in team_right.items()}
        
    async def start_game(self, consumer):
        self.is_playing = True
        self.is_end = False
        self._reset_round()
        await notify_group(consumer.channel_layer, self.room_id, event='notifyGameStart', content={})
        await self._game_loop(consumer)

    async def _game_loop(self, consumer):
        while self.is_playing and not self.is_end:
            self.ball.move()
            self._detect_collisions()
            await self._send_ball_update(consumer)
            await asyncio.sleep(1 / FRAME_PER_SECOND)

    async def _update_paddle_location(self, consumer, content):
        client_id = content['clientId']
        pos_x = content['xPosition']
        pos_y = content['yPosition']
        player = self.clients[client_id]
        player.update_pos(pos_x, pos_y)
        await notify_group(consumer.channel_layer, self.room_id, 
                           event='notifyPaddleLocationUpdate', 
                           content=content)
    
    async def _add_score(self, consumer):
        if self.ball.dx > 0:
            self.score[LEFT] += 1
            win_team = 'left'
        else:
            self.score[RIGHT] += 1
            win_team = 'right'
        consumer = self.clients[0].consumer
        await notify_group(consumer.channel_layer, self.room_id, 
                           event='notifyScoreUpdate', 
                           content={'team': win_team, 'score': self.score[win_team]})
            
    async def _check_game_end(self, consumer):
        if self.score[LEFT] >= 5 or self.score[RIGHT] >= 5:
            team = 'left' if self.score[LEFT] >= 5 else 'right'
            self._end_game()
            await notify_group(consumer.channel_layer, self.room_id, 
                               event='notifyGameEnd', 
                               content={'winTeam': team })
        
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
                break

    def _is_ball_colliding_with_paddle(self, player):
        if (self.ball.pos_y >= player.pos_y - player.paddle_height / 2 and
                self.ball.pos_y <= player.pos_y + player.paddle_height / 2):
            if (self.ball.dx > 0 and self.ball.get_right_x() >= player.posX - player.paddle_width / 2) or \
               (self.ball.dx < 0 and self.ball.get_left_x() <= player.posX + player.paddle_width / 2):
                return True
        return False

    async def _send_ball_update(self, consumer):
        await notify_group(consumer.channel_layer, self.room_id, 
                           event='notifyBallLocationUpdate', 
                           content={
                                'xPosition': self.ball.pos_x,
                                'yPosition': self.ball.pos_y })

    async def _end_round(self):
        await self._add_score()
        await self._check_game_end()
        await self._reset_round()

    async def _reset_round(self, team):
        serve_position = self.board_width / 4 if self.serve_turn == LEFT else 3 * self.board_width / 4
        self.ball.reset_ball(serve_position, self.board_height / 2, 0)
        
        # paddle reset 필요한가?
        # team_width = self.board_width / 8
        # for player in self.left_team:
        #     player.update_pos(team_width, self.board_height / 2)
        # for player in self.right_team:
        #     player.update_pos(self.board_width - team_width, self.board_height / 2)

    async def _give_up_game(self, consumer):
        self._end_game()
        client_id = consumer.client_id
        await notify_group(consumer.channel_layer, self.room_id, 
                           event='notifyGameGiveUp', content={'clientId': client_id})

    def _end_game(self):
        self.is_playing = False
        self.is_end = True
