import asyncio
from .ball import Ball
from .player import Player
from utils.printer import Printer
from asyncio import Queue

FRAME_PER_SECOND = 60

LEFT = 'left'
RIGHT = 'right'

class GameManager:
    def __init__(self, room_id, left_mode, right_mode):
        self.channel_layer = None
        self.game_task = None
        self.input_task = None
        self.room_id = room_id
        self.team_left = {}
        self.team_right = {}
        self.left_mode = left_mode
        self.right_mode = right_mode
        self.board_width = 1550
        self.board_height = 1000
        self.ball_radius = 25
        self.ball = Ball(6, self.ball_radius)
        self.is_playing = False
        self.is_end = False
        self.score = {LEFT: 0, RIGHT: 0}
        self.serve_turn = LEFT
        self.queue = Queue()  # Queue 추가

    async def _notify_game_room(self, event, content):
        await self.channel_layer.group_send(
            self.room_id,
            {
                'type': event,
                'content': content
            }
        )

    async def _notify_game_ready_and_start(self):
        await self._notify_game_room('notifyGameReady', {})
        await asyncio.sleep(1.5)
        await self._notify_game_room('notifyGameStart', {})

    async def set_game_mode(self, left_mode, right_mode):
        pass
    
    async def set_game_manager(self, room, consumer):
        self.channel_layer = consumer.channel_layer
        team_left = room['teamLeft']
        team_right = room['teamRight']
        self.team_left = {client_id: Player(info['nickname'], info['ability']) for client_id, info in team_left.items()}
        self.team_right = {client_id: Player(info['nickname'], info['ability']) for client_id, info in team_right.items()}
        left_mode = room['leftMode']
        right_mode = room['rightMode']
        self.clients = {**self.team_left, **self.team_right}
        self.set_game_mode(left_mode, right_mode)
        
    async def trigger_game(self):
        self.is_playing = True
        self.is_end = False
        self._reset_round()
        asyncio.create_task(self._notify_game_ready_and_start())
        asyncio.create_task(self._game_loop())
        asyncio.create_task(self._input_loop()) 

    async def _game_loop(self):
        await asyncio.sleep(1.5)
        while self.is_playing and not self.is_end:
            self.ball.move()
            if self._detect_collisions():
                await self._handle_round_end()
            await self._send_ball_update()
            await asyncio.sleep(1 / FRAME_PER_SECOND)

            
    async def _input_loop(self):
        while self.is_playing and not self.is_end:
            while not self.queue.empty():
                client_id, content = await self.queue.get()
                self._update_paddle_position(client_id, content)
            await asyncio.sleep(0.01)
            # Printer.log("input loop", "green")

    async def _handle_round_end(self):
        self._add_score()
        await self._notify_score_update()
        if self._check_game_end():
            await self._handle_game_end()
        else:
            self._reset_round()

    def _add_score(self):
        if self.ball.dx > 0:
            self.score[LEFT] += 1
        else:
            self.score[RIGHT] += 1
    
    async def _notify_score_update(self):
        win_team = 'left' if self.ball.dx > 0 else 'right'
        await self._notify_game_room('notifyScoreUpdate', {'team': win_team, 'score': self.score[win_team]})
        
    def _check_game_end(self):
        return self.score[LEFT] >= 5 or self.score[RIGHT] >= 5

    async def _handle_game_end(self):
        team = 'left' if self.score[LEFT] >= 5 else 'right'
        self._end_game()
        await self._notify_game_room('notifyGameEnd', {'winTeam': team})
        
    async def _send_ball_update(self):
        await self._notify_game_room('notifyBallLocationUpdate',
                                     {'xPosition': self.ball.pos_x, 'yPosition': self.ball.pos_y})

    async def _give_up_game(self, consumer):
        self._end_game()
        client_id = consumer.client_id
        await self._notify_game_room('notifyGameGiveUp', {'clientId': client_id})

    async def _update_paddle_location(self, client_id, content):
        await self.queue.put((client_id, content))

    def _update_paddle_position(self, client_id, content):
        player = self.clients[client_id]
        player.update_pos(content['xPosition'], content['yPosition'])

    async def _notify_paddle_location_update(self, client_id, content):
        content = {'clientId': client_id, 'xPosition': content['xPosition'], 'yPosition': content['yPosition']}
        await self._notify_game_room('notifyPaddleLocationUpdate', content)

    def _reset_round(self):
        serve_position = self.board_width / 4 if self.serve_turn == LEFT else 3 * self.board_width / 4
        self.ball.reset_ball(serve_position, self.board_height / 2, 0)

    def _end_game(self):
        self.is_playing = False
        self.is_end = True
        self._reset_game()
        
    def _reset_game(self):
        self.score = {LEFT: 0, RIGHT: 0}
        self.serve_turn = LEFT
        self.is_playing = False
        self.is_end = False
        self.team_left = {}
        self.team_right = {}
        self._reset_round()

    def _detect_collisions(self):
        if self.ball.get_right_x() >= self.board_width:
            self.serve_turn = LEFT
            return True
        elif self.ball.get_left_x() <= 0:
            self.serve_turn = RIGHT
            return True
        elif self.ball.get_top_y() <= 0 or self.ball.get_bottom_y() >= self.board_height:
            self.ball.dy = -self.ball.dy
        else:
            self._detect_paddle_collision()
        return False 

    def _detect_paddle_collision(self):
        players_to_check = self.team_right if self.ball.dx > 0 else self.team_left
        for player in players_to_check.values():
            if self._is_ball_colliding_with_paddle(player):
                self.ball.reversal_random()

    def _is_ball_colliding_with_paddle(self, player):
        if (self.ball.pos_y >= player.pos_y - player.paddle_height / 2 and
                self.ball.pos_y <= player.pos_y + player.paddle_height / 2):
            if (self.ball.dx > 0 and self.ball.get_right_x() >= player.posX - player.paddle_width / 2) or \
               (self.ball.dx < 0 and self.ball.get_left_x() <= player.posX + player.paddle_width / 2):
                return True
        return False