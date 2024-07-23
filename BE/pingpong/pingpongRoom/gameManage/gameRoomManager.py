import asyncio
from .ball import Ball
from .player import Player
from asyncio import Queue
import uuid
import random
import copy
from django.utils import timezone

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

END_SCORE = 100


class GameRoomManager:
    def __init__(self, channel_layer, room_id, title, left_mode='human', right_mode='human', left_max_count=1, right_max_count=1, mode='tournament'):
        self.channel_layer = channel_layer

        self.mode = mode

        #common game room info
        self.room_id = room_id
        self.title = title
        self.clients = {} # {client_id : Player}
        self.team_left = {} 
        self.team_right = {}
        self.left_max_count = left_max_count
        self.right_max_count = right_max_count
        self.left_mode = left_mode
        self.right_mode = right_mode
        self.left_ability = None
        self.right_ability = None

        # game playing info
        self.board_width = 1550
        self.board_height = 1000
        self.ball_radius = 25
        self.ball = Ball(NORMAL_SPEED, self.ball_radius)
        self.is_playing = False
        self.is_end = False
        self.score = {LEFT: 0, RIGHT: 0}
        self.round = 0
        self.serve_turn = LEFT
        self.fake_ball = {}
        self.queue = Queue()

        #statics
        self.win_team = None
        self.start_time = None
        self.end_time = None
        self.round_hit_map = []
        self.game_data = {}

    # getter
    
    def get_room_client_count(self):
        return len(self.clients)

    def get_room_ability(self):
        return self.left_ability, self.right_ability

    def enter_room(self, client_id, nickname, image_uri):
        team = None
        player = None
        if len(self.team_left) < self.left_max_count:
            player = Player(nickname, ability=None, team='left', image_uri=image_uri)
            self.team_left[client_id] = player
            team = 'left'
        elif len(self.team_right) < self.right_max_count:
            player = Player(nickname, ability=None, team='right', image_uri=image_uri)
            self.team_right[client_id] = player
            team = 'right'
        if player:
            self.clients[client_id] = player
        return team

    def remove_client(self, client_id):
        if client_id in self.clients:
            del self.clients[client_id]
        if client_id in self.team_left:
            del self.team_left[client_id]
        elif client_id in self.team_right:
            del self.team_right[client_id]

    def get_room_data(self):
        return {
            'roomId': self.room_id,
            'title': self.title,
            'leftMode': self.left_mode,
            'rightMode': self.right_mode,
            'currentPlayerCount': self.get_room_client_count(),
            'maxPlayerCount': self.left_max_count + self.right_max_count
        }

    def get_team_list(self, team):
        team_list = self.team_left if team == 'left' else self.team_right
        data = []
        for client_id, player in team_list.items():
            data.append({
                'id': client_id,
                'nickname': player.nickname,
                'avatarUrl': player.image_uri,
                'readyState': player.ready_state
            })
        return data

    def set_client_ready_state(self, client_id, state):
        player = self.clients[client_id]
        player.set_state(state)
        
    def check_game_ready(self):
        if not self.is_room_full():
            return False
        return all(player.ready_state == 'READY' for player in self.clients.values())

    def set_client_ability(self, client_id, ability):
        player = None
        if client_id in self.team_left:
            player = self.team_left[client_id]
            player.ability = ability
            self.left_ability = ability
        elif client_id in self.team_right:
            player = self.team_right[client_id]
            player.ability = ability
            self.right_ability = ability

    def get_client_ability(self, client_id):
        team = None
        ability = None
        if client_id in self.team_left:
            team = 'left'
            ability = self.left_ability
        elif client_id in self.team_right:
            team = 'right'
            ability = self.right_ability
        return team, ability

    def is_room_full(self):
        return len(self.clients) == self.left_max_count + self.right_max_count

    def is_room_empty(self):
        return len(self.clients) == 0

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

    # Game Info Setting

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
        
    async def trigger_game(self):
        self.is_playing = True
        self.is_end = False
        self._reset_round()
        self.check_jiant_blocker(self.left_ability, self.right_ability)
        asyncio.create_task(self._notify_game_ready_and_start())
        asyncio.create_task(self._game_loop())
        asyncio.create_task(self._paddle_update_loop())

    # Game Loop

    async def _game_loop(self):
        await asyncio.sleep(1.5)
        self.start_time = timezone.now()
        await self._notify_all_paddle_positions()
        while self.is_playing and not self.is_end:
            is_ghost = self.ball.move()
            if is_ghost == False:
                await self._notify_game_room('notifyUnghostBall', {})
            ball_state = self._detect_collisions(self.ball)
            await self._send_ball_update(ball_state, self.ball)
            await asyncio.sleep(1 / FRAME_PER_SECOND)
        self.end_time = timezone.now()
        await self.save_data_to_db()
        await self._notify_game_room('notifyGameEnd', {'winTeam': self.win_team})

    async def _paddle_update_loop(self):
        while self.is_playing and not self.is_end:
            for client_id, player in self.clients.items():
                if player.needs_update():
                    pos_x, pos_y = player.move()
                    content = {'xPosition': pos_x, 'yPosition': pos_y}
                    await self._notify_paddle_location_update(client_id, content)
            await asyncio.sleep(1 / FRAME_PER_SECOND)

    # Fake Ball - IllusionFaker

    async def _fake_ball_loop(self, index):
        from utils.printer import Printer
        Printer.log(f"Fake ball {index} created", "yellow")
        fake_ball = self.fake_ball[index]
        Printer.log(f"Fake ball {index} angle:" + str(fake_ball.angle), "yellow")
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
        await self._notify_game_room('notifyFakeBallCreate', {'count' : count})
        for i in range(count - 1):
            id = str(uuid.uuid4())
            self.fake_ball[id] = Ball(NORMAL_SPEED, self.ball_radius)
            rand = random.randint(-15, 15)
            self.fake_ball[id].reset_ball(self.ball.pos_x, self.ball.pos_y)
            self.fake_ball[id].change_direction(self.ball.angle + rand)
            asyncio.create_task(self._fake_ball_loop(id))

    # Playing Methods

    def _detect_collisions(self, ball):
        state = NOHIT
        if ball.get_right_x() >= self.board_width:
            self.serve_turn = LEFT
            self.save_hit_map('SCORE', ball.pos_y, ball.pos_x)
            return SCORE
        elif ball.get_left_x() <= 0:
            self.save_hit_map('SCORE', ball.pos_y, ball.pos_x)
            self.serve_turn = RIGHT
            return SCORE
        elif ball.get_top_y() <= 0 or ball.get_bottom_y() >= self.board_height:
            ball.dy = -ball.dy
            state = self._detect_paddle_collision(ball)
        return state

    def _detect_paddle_collision(self, ball):
        if self.ball.speed == 0:
            players_to_check = self.team_left.values() if self.serve_turn == LEFT else self.team_right.values()
        else:
            players_to_check = self.team_left.values() if ball.dx <= 0 else self.team_right.values()
        speed = NORMAL_SPEED
        angle = 0
        for player in players_to_check:
            # print(player.nickname)
            if self._is_ball_colliding_with_paddle(player):
                self.save_hit_map('PADDLE', ball.pos_y, ball.pos_x)
                state = PADDLE
                if player.ability == 'speedTwister':
                    speed = speed * 2
                    angle = 30
                    state = SPEEDTWIST
                elif player.ability == 'illusionFaker':
                    state = FAKE
                elif player.ability == 'ghostSmasher':
                    ball.is_vanish = True
                    state = GHOST
                elif player.ability == None and speed != NORMAL_SPEED:
                    state = NORMALIZE
                if ball.speed == 0:
                    ball.start_move(speed, self.serve_turn)
                else:
                    ball.reversal_random(speed, angle)
                return state
        return NOHIT

    def _is_ball_colliding_with_paddle(self, player):
        if player.is_moving_front() and player.is_colliding_with_ball(self.ball):
            return True
        return False
    
    def update_target(self, client_id, x, y):
        self.clients[client_id].update_target(x, y)

    async def update_paddle_location(self, client_id, content):
        await self.queue.put((client_id, content))

    ### Game control methods

    async def _round_end_with_score(self):
        round_win_team = self._add_score()
        self.save_data(round_win_team)
        await self._notify_score_update()
        if self._check_game_end():
            self.win_team = self._end_game_loop()
        else:
            self._reset_round()

    def _add_score(self):
        if self.ball.dx > 0:
            self.score[LEFT] += 1
            return 'left'
        else:
            self.score[RIGHT] += 1
            return 'right'
        
    def _check_game_end(self):
        if self.score[LEFT] >= END_SCORE:
            self.win_team = 'left'
            return True
        elif self.score[RIGHT] >= END_SCORE:
            self.win_team = 'right'
            return True
        return False

    def _end_game_loop(self):
        team = 'left' if self.score[LEFT] >= END_SCORE else 'right'
        self._change_game_state()
        return team

    def _reset_round(self):
        self.round = self.round + 1
        self.ball.set_ball_to_serve(self.serve_turn, self.board_width, self.board_height)
        for player in self.clients.values():
            player.reset_pos()
        asyncio.create_task(self._notify_all_paddle_positions())

    def _change_game_state(self):
        self.is_playing = False
        self.is_end = True
        
    ### DB

    async def save_data_to_db(self):
        data = {
            "start_time" : self.start_time,
            "end_time" : self.end_time,
            "mode": self.get_game_mode(),
            "team1_users": self.get_client_id_list('left'),
            "team1_kind": self.left_mode,
            "team2_users": self.get_client_id_list('right'),
            "team2_kind": self.right_mode,
            "team1_ability": self.left_ability,
            "team2_ability": self.right_ability,
            "win_team" : self.win_team,
            "team1_score" : self.score[LEFT],
            "team2_score" : self.score[RIGHT],
            "round": self.game_data
        }
        from pingpongRoom.repositories import GameRepository
        game = await GameRepository.save_game_async(data)

        # Gamn DB Test, 지울 것.
        game = await GameRepository.get_games_by_user_id(self.clients[0])
        print(game)
        # game None 처리 필요
    
    def save_data(self, round_win_team):
        data = {
            'win_team' : round_win_team,
            'ball_hits' : copy.deepcopy(self.round_hit_map)
        }
        self.game_data[self.round] = data
        self.round_hit_map = []

    def save_hit_map(self, type, y, x):
        data = {
            'y' : y,
            'x' : x,
            'type' : type
        }
        self.round_hit_map.append(data)
    
    def get_game_mode(self):
        if self.left_mode == 'human' and self.right_mode == 'human':
            mode = 'HUMAN_HUMAN'
        elif self.left_mode == 'vampire' and self.right_mode == 'human':
            mode = 'VAMPIRE_HUMAN'
        else:
            mode = 'VAMPIRE_VAMPIRE'
        return mode
    
    def get_client_id_list(self, team):
        if team == 'left':
            team = self.team_left
        else:
            team = self.team_right
        data = []
        for client_id, player in team.items():
            data.append(client_id)
        return data

    ### Notify & Async methods
        
    async def _send_ball_update(self, ball_state, ball):
        team = 'left' if ball.dx > 0 else 'right'
        if ball_state == SCORE:
            await self._round_end_with_score()
        elif ball_state == GHOST:
            await self._notify_game_room('notifyGhostBall', {})
        elif ball_state == SPEEDTWIST:
            await self._notify_game_room('notifySpeedTwistBall', {})
        elif ball_state == NORMALIZE:
            await self._notify_game_room('notifyUnspeedTwistBall', {})
        elif ball_state == FAKE:
            asyncio.create_task(self._create_fake_ball(team))
        if self.ball.is_vanish:
            if self.ball.dx < 0:
                room_id_team = f"{self.room_id}-right"
            else:
                room_id_team = f"{self.room_id}-left"
        else:
            room_id_team = self.room_id
        if self.is_playing:
            await self._notify_game_room_group(room_id_team, 'notifyBallLocationUpdate', 
                {'xPosition': self.ball.pos_x, 'yPosition': self.ball.pos_y})

    async def give_up_game(self, consumer):
        self._change_game_state()
        client_id = consumer.client_id
        self.win_team = 'left' if client_id in self.team_left else  'right'
        if self.is_playing:
            await self._notify_game_room('notifyGameGiveUp', {'clientId': client_id})

    async def _notify_game_ready_and_start(self):
        board_data = { 'boardWidth': self.board_width, 'boardHeight': self.board_height , 'ballRadius': self.ball_radius}
        player_data = self._get_player_data()
        data = {
            "playerInfo" : player_data,
            "teamInfo" : { "leftTeamAbilitfy " : self.left_mode, "rightTeamAbility" : self.right_mode},
            "boardInfo" : board_data
        }
        await self._notify_game_room('notifyGameRoomReady', {})
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