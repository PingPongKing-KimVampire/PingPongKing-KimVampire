import asyncio
from .ball import Ball
from .player import Player
from asyncio import Queue

FRAME_PER_SECOND = 60
LEFT = 'left'
RIGHT = 'right'

NOHIT = 0
SCORE = 1
PADDLE = 2
GHOST = 3
SPEEDTWIST = 4
FAKE = 5
NORMALIZE = 6

NORMAL_SPEED = 10

class GameManager:
    def __init__(self, room_id, left_mode, right_mode, channel_layer):
        self.channel_layer = channel_layer
        self.clients = {}
        self.room_id = room_id
        self.team_left = {}
        self.team_right = {}
        self.left_mode = left_mode
        self.right_mode = right_mode
        self.board_width = 1550
        self.board_height = 1000
        self.ball_radius = 25
        self.ball = Ball(NORMAL_SPEED, self.ball_radius)
        self.is_playing = False
        self.is_end = False
        self.score = {LEFT: 0, RIGHT: 0}
        self.serve_turn = LEFT
        self.fake_ball = {}
        self.queue = Queue()

    # Game Setting

    def _get_player_data(self):
        player_data = []
        for client_id, player in self.clients.items():
            player_data.append({
                'clientId': client_id,
                'paddleWidth': player.paddle_width,
                'paddleHeight': player.paddle_height,
                'team': player.team,
                'ability': player.ability,
            })
        return player_data

    def check_jiant_blocker(self, left_mode, right_mode):
        if left_mode == 'jiantBlocker':
            self.set_team_paddle_size('left', 'big')
            self.set_team_paddle_size('right', 'small')
        if right_mode == 'jiantBlocker':
            self.set_team_paddle_size('right', 'big')
            self.set_team_paddle_size('left', 'small')

    def set_team_paddle_size(self, team, size):
        if team == 'left':
            team = self.team_left
        else:
            team = self.team_right
        for player in team.values():
            player.modify_paddle_size(size)
        
    def set_players(self, room):
        self.team_left = self.set_team(room, 'left')
        self.team_right = self.set_team(room, 'right')
        left_mode = room['leftMode']
        right_mode = room['rightMode']
        left_mode = self.set_team_ability(self.team_left)
        self.clients = {**self.team_left, **self.team_right}
        self.check_jiant_blocker(left_mode, right_mode)

    def set_team(self, room, team):
        player_arr = room[team]
        player_count = len(player_arr)
        ability = room[team + 'Ability']
        team = {client_id: Player(info['nickname'], ability, team, player_count) for client_id, info in player_arr.items()}
        return team

    def set_team_ability(self, team):
        for player in team.values():
            # player.ability = 'jiantBlocker'
            # player.ability = 'speedTwister'
            player.ability = 'illusionFaker'
            # player.ability = 'ghostSmasher'
        return player.ability
        
    async def trigger_game(self):
        self.is_playing = True
        self.is_end = False
        self._reset_round()
        asyncio.create_task(self._notify_game_ready_and_start())
        asyncio.create_task(self._game_loop())
        # asyncio.create_task(self._input_loop())
        asyncio.create_task(self._paddle_update_loop())

    # Game Loop

    async def _game_loop(self):
        await asyncio.sleep(1.5)
        await self._notify_all_paddle_positions()
        while self.is_playing and not self.is_end:
            is_ghost = self.ball.move()
            if is_ghost == False:
                await self._notify_game_room('notifyUnghostBall', {})
            ball_state = self._detect_collisions(self.ball)
            await self._send_ball_update(ball_state)
            await asyncio.sleep(1 / FRAME_PER_SECOND)

    # async def _input_loop(self):
    #     while self.is_playing and not self.is_end:
    #         while not self.queue.empty():
    #             client_id, content = await self.queue.get()
    #             self._update_paddle_position(client_id, content)
    #         await asyncio.sleep(0.01)

    def update_target(self, client_id, x, y):
        self.clients[client_id].update_target(x, y)

    async def _paddle_update_loop(self):
        debug_x, debug_y = 0, 0
        while self.is_playing and not self.is_end:
            for client_id, player in self.clients.items():
                if player.needs_update():
                    pos_x, pos_y = player.move()
                    # print("player pos: ", pos_x, pos_y)
                    # if debug_x - pos_x > 15 or debug_y - pos_y > 15:
                    #     print("debug pos: ", debug_x, debug_y)
                    content = {'xPosition': pos_x, 'yPosition': pos_y}
                    await self._notify_paddle_location_update(client_id, content)
                    debug_x, debug_y = player.pos_x, player.pos_y
            await asyncio.sleep(1 / FRAME_PER_SECOND)

    # Fake Ball - IllusionFaker

    async def _fake_ball_loop(self, index):
        from utils.printer import Printer
        Printer.log(f"Fake ball {index} created", "yellow")
        fake_ball = self.fake_ball[index]
        while self.is_playing and not self.is_end:
            fake_ball.move()
            ball_state = self._detect_collisions(fake_ball)
            if ball_state != NOHIT:
                Printer.log("hit reason: " + str(ball_state), "yellow")
                await self._notify_game_room('notifyFakeBallRemove', {'ballId': index})
                break
            await self._send_fake_ball_update(index)
            await asyncio.sleep(1 / FRAME_PER_SECOND)
        self.fake_ball[index] = None

    async def _create_fake_ball(self, team_illusion):
        if team_illusion == 'left':
            count = self.team_right.__len__()
        else:
            count = self.team_left.__len__()
        from utils.printer import Printer
        await self._notify_game_room('notifyFakeBallCreate', {'count' : count})
        for i in range(count):
        # for i in range(count - 1):
            self.fake_ball[i] = Ball(NORMAL_SPEED, self.ball_radius)
            self.fake_ball[i].reset_ball(self.ball.pos_x, self.ball.pos_y, self.ball.angle)
            self.fake_ball[i].reversal_random()
            asyncio.create_task(self._fake_ball_loop(i))

    # Playing Methods
        
    async def _send_ball_update(self, ball_state):
        if ball_state == SCORE:
            await self._round_end_with_score()
        elif ball_state == GHOST:
            await self._notify_game_room('notifyGhostBall', {})
        elif ball_state == SPEEDTWIST:
            await self._notify_game_room('notifySpeedTwistBall', {})
        elif ball_state == NORMALIZE:
            await self._notify_game_room('notifyUnspeedTwistBall', {})
        if self.ball.is_vanish:
            if self.ball.dx < 0:
                room_id_team = f"{self.room_id}-right"
            else:
                room_id_team = f"{self.room_id}-left"
        else:
            room_id_team = self.room_id
        await self._notify_game_room_group(room_id_team, 'notifyBallLocationUpdate', 
            {'xPosition': self.ball.pos_x, 'yPosition': self.ball.pos_y})

    # def _update_paddle_position(self, client_id, content):
    #     player = self.clients[client_id]
    #     player.update_target(content['xPosition'], content['yPosition'])

    def _detect_collisions(self, ball):
        if ball.get_right_x() >= self.board_width:
            # print("right_x: ", ball.get_right_x())
            # print("board_width: ", self.board_width)
            self.serve_turn = LEFT
            return SCORE
        elif ball.get_left_x() <= 0:
            # print("left_x: ", ball.get_left_x())
            # print("board_width: ", self.board_width)
            self.serve_turn = RIGHT
            return SCORE
        elif ball.get_top_y() <= 0 or ball.get_bottom_y() >= self.board_height:
            ball.dy = -ball.dy
        else:
            state = self._detect_paddle_collision(ball)
            if state != NOHIT:
                return state
        return NOHIT

    async def update_paddle_location(self, client_id, content):
        await self.queue.put((client_id, content))

    def _detect_paddle_collision(self, ball):
        players_to_check = self.team_right.values() if ball.dx > 0 else self.team_left.values()
        team = 'right' if ball.dx > 0 else 'left'
        speed = NORMAL_SPEED
        angle = 0
        for player in players_to_check:
            if self._is_ball_colliding_with_paddle(player):
                state = PADDLE
                if player.ability == 'speedTwister':
                    speed = ball.speed * 2
                    angle = 30
                    state = SPEEDTWIST
                elif player.ability == 'illusionFaker':
                    asyncio.create_task(self._create_fake_ball(team))
                    state = FAKE
                elif player.ability == 'ghostSmasher':
                    ball.is_vanish = True
                    state = GHOST
                elif player.ability == None and ball.speed != speed:
                    state = NORMALIZE
                ball.reversal_random(speed, angle)
                return state
        return NOHIT

    def _is_ball_colliding_with_paddle(self, player):
        if (self.ball.pos_y >= player.pos_y - player.paddle_height / 2 and
                self.ball.pos_y <= player.pos_y + player.paddle_height / 2):
            if (self.ball.dx > 0 and self.ball.get_right_x() >= player.pos_x - player.paddle_width / 2) or \
               (self.ball.dx < 0 and self.ball.get_left_x() <= player.pos_x + player.paddle_width / 2):
                return True
        return False
    
    ### Game control methods

    async def _round_end_with_score(self):
        self._add_score()
        await self._notify_score_update()
        if self._check_game_end():
            await self._end_game_loop()
        else:
            self._reset_round()

    def _add_score(self):
        if self.ball.dx > 0:
            self.score[LEFT] += 1
        else:
            self.score[RIGHT] += 1
        
    def _check_game_end(self):
        return self.score[LEFT] >= 5 or self.score[RIGHT] >= 5

    async def _end_game_loop(self):
        team = 'left' if self.score[LEFT] >= 5 else 'right'
        self._end_game()
        await self._notify_game_room('notifyGameEnd', {'winTeam': team})

    def _reset_round(self):
        serve_position = self.board_width / 4 if self.serve_turn == LEFT else 3 * self.board_width / 4
        self.ball.reset_ball(serve_position, self.board_height / 2, 0)
        for player in self.clients.values():
            player.reset_pos()
        asyncio.create_task(self._notify_all_paddle_positions())

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

    async def give_up_game(self, consumer):
        self._end_game()
        client_id = consumer.client_id
        if self.is_playing:
            await self._notify_game_room('notifyGameGiveUp', {'clientId': client_id})
    
    ### Notify methods

    async def _notify_game_room(self, event, content):
        await self.channel_layer.group_send(
            self.room_id,
            {
                'type': event,
                'content': content
            }
        )

    async def _notify_game_room_group(self, group, event, content):
        await self.channel_layer.group_send(
            group,
            {
                'type': event,
                'content': content
            }
        )

    async def _notify_game_ready_and_start(self):
        board_data = { 'boardWidth': self.board_width, 'boardHeight': self.board_height , 'ballRadius': self.ball_radius}
        player_data = self._get_player_data()
        data = {
            "playerInfo" : player_data,
            "teamInfo" : { "leftTeamAbilitfy " : self.left_mode, "rightTeamAbility" : self.right_mode},
            "boardInfo" : board_data
        }
        await self._notify_game_room('notifyGameReady', {})
        await asyncio.sleep(1.5)
        await self._notify_game_room('notifyGameStart', data)

    async def _notify_paddle_location_update(self, client_id, content):
        content = {'clientId': client_id, 'xPosition': content['xPosition'], 'yPosition': content['yPosition']}
        await self._notify_game_room('notifyPaddleLocationUpdate', content)
        
    async def _notify_all_paddle_positions(self):
        for client_id, player in self.clients.items():
            content = {'clientId': client_id, 'xPosition': player.pos_x, 'yPosition': player.pos_y}
            await self._notify_paddle_location_update(client_id, content)

    async def _send_fake_ball_update(self, index):
        await self._notify_game_room('notifyFakeBallLocationUpdate', 
            {'ballId': index, 'xPosition': self.fake_ball[index].pos_x, 'yPosition': self.fake_ball[index].pos_y})
    
    async def _notify_score_update(self):
        win_team = 'left' if self.ball.dx > 0 else 'right'
        await self._notify_game_room('notifyScoreUpdate', {'team': win_team, 'score': self.score[win_team]})