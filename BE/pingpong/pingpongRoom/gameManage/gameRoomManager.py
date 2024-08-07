import asyncio
import uuid
import random

from .ball import Ball
from .player import Player
from .gameRoomNotifier import GameRoomNotifier
from .gameDataManager import GameDataManager

FRAME_PER_SECOND = 60
LEFT = 'left'
RIGHT = 'right'

NOHIT = 0
SCORE = 1
PADDLE = 2
GHOST = 3
SPEEDTWIST = 4
FAKE = 5
UNSPEEDTWIST = 6

END_SCORE = 5


class GameRoomManager:
    def __init__(self, channel_layer, room_id, title, left_mode='human', right_mode='human', left_max_count=1, right_max_count=1, mode='tournament'):
        self.mode = mode

        # common game room info
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
        self.board_width = 1600
        self.board_height = 1000
        self.ball_radius = 25
        self.ball = Ball()
        self.ball.set_ball_to_serve('left', self.board_width, self.board_height)
        self.is_playing = False
        self.is_end = False
        self.score = {LEFT: 0, RIGHT: 0}
        self.round = 0
        self.serve_turn = LEFT
        self.fake_ball = {}
        self.queue = asyncio.Queue()
        self.is_scored = False

        # notifier
        self.notifier = GameRoomNotifier(channel_layer, room_id, self.ball)

        # statics
        self.db_manager = GameDataManager(self.left_mode, self.right_mode)
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
            
    def get_client_team(self, client_id):
        if client_id in self.team_left:
            return 'left'
        elif client_id in self.team_right:
            return 'right'
        return None

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
        
    def get_game_info(self):
        board_data = { 'boardWidth': self.board_width, 'boardHeight': self.board_height , 'ballRadius': self.ball_radius}
        player_data = self._get_player_data()
        data = {
            "playerInfo" : player_data,
            "teamInfo" : { "leftTeamAbilitfy " : self.left_mode, "rightTeamAbility" : self.right_mode},
            "boardInfo" : board_data,
            "score" : [self.score[LEFT], self.score[RIGHT]]
        }
        return data
        
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
        self.db_manager.set_teams_info(self.team_left, self.team_right, self.left_ability, self.right_ability)
        self.is_playing = True
        self._reset_round()
        self.check_jiant_blocker(self.left_ability, self.right_ability)
        asyncio.create_task(self._game_ready_and_start())
        asyncio.create_task(self._game_loop())
        asyncio.create_task(self._paddle_update_loop())

    # Game Loop

    async def _game_loop(self):
        await asyncio.sleep(1.5)
        self.db_manager.set_start_time()
        await self._send_all_paddle_location()
        while self.is_playing and not self.is_end:
            self.ball.move()
            ball_state = await self._detect_collisions(self.ball)
            await self._send_real_ball_update(ball_state)
            await asyncio.sleep(1 / FRAME_PER_SECOND)
        self.db_manager.set_end_time()
        await self.db_manager.save_data_to_db(self.score, self.win_team)
        await self.notifier.broadcast('notifyGameEnd', {'winTeam': self.win_team})

    def update_target(self, client_id, x, y):
        self.clients[client_id].update_target(x, y)

    async def _paddle_update_loop(self):
        while self.is_playing and not self.is_end:
            for client_id, player in self.clients.items():
                if player.needs_update():
                    pos_x, pos_y = player.move()
                    data = {'clientId' : client_id, 'xPosition': pos_x, 'yPosition': pos_y}
                    if self.is_playing:
                        await self.notifier.broadcast('notifyPaddleLocationUpdate', data)
            await asyncio.sleep(1 / FRAME_PER_SECOND)

    # Fake Ball - IllusionFaker

    async def _fake_ball_loop(self, index):
        fake_ball = self.fake_ball[index]
        while self.is_playing and not self.is_end and not self.is_scored:
            fake_ball.move()
            ball_state = await self._detect_collisions(fake_ball)
            if ball_state != NOHIT:
                break
            await self._send_fake_ball_location_update(index)
            await asyncio.sleep(1 / FRAME_PER_SECOND)
        if self.is_playing:
            await self.notifier.broadcast('notifyFakeBallRemove', {'ballId': index})
        self.fake_ball[index] = None

    async def _create_fake_ball(self):
        team_illusion = 'left' if self.ball.dx > 0 else 'right'
        if team_illusion == 'left':
            count = self.team_right.__len__()
        else:
            count = self.team_left.__len__()
        id_list = []
        for i in range(count):
            id = str(uuid.uuid4())
            id_list.append(id)
            self.fake_ball[id] = Ball(hit_count=self.ball.hit_count)
            rand = random.randint(-15, 15)
            self.fake_ball[id].reset_ball(self.ball.pos_x, self.ball.pos_y)
            self.fake_ball[id].change_direction(self.ball.angle + rand)
        if self.is_playing:
            await self.notifier.broadcast('notifyFakeBallCreate', {'idList' : id_list})
        for id in id_list:
            asyncio.create_task(self._fake_ball_loop(id))
            
    async def _send_fake_ball_location_update(self, index):
        data = {
            'ballId' : index, 
            'xPosition': self.fake_ball[index].pos_x, 
            'yPosition': self.fake_ball[index].pos_y
        }
        if self.is_playing:
            await self.notifier.broadcast('notifyFakeBallLocationUpdate', data)

    # Playing Methods

    async def _detect_collisions(self, ball):
        ball_state = self._detect_board_collision(ball)
        if ball_state == NOHIT:
            ball_state = await self._detect_paddle_collision(ball)
        return ball_state
    
    def _detect_board_collision(self, ball):
        if ball.get_right_x() >= self.board_width:
            self.serve_turn = LEFT
            return SCORE
        elif ball.get_left_x() <= 0:
            self.serve_turn = RIGHT
            return SCORE
        elif ball.get_top_y() <= 0 or ball.get_bottom_y() >= self.board_height:
            ball.dy = -ball.dy
        return NOHIT

    async def _detect_paddle_collision(self, ball):
        players_to_check = self._get_players_to_check(ball)
        for player in players_to_check:
            # print(player.nickname)
            if self._is_ball_colliding_with_paddle(player, ball):
                return await self._apply_paddle_hit(player, ball)
        return NOHIT
    
    async def _apply_paddle_hit(self, player, ball):
        self.db_manager.save_hit_map('PADDLE', ball.pos_y, ball.pos_x)
        state = []

        state = PADDLE
        if player.ability == 'speedTwister':
            ball.is_speedtwist = True
            await self.notifier.broadcast('notifySpeedTwistBall')
        elif ball.is_speedtwist:
            ball.is_speedtwist = False
            await self.notifier.broadcast('notifyUnspeedTwistBall')
        if player.ability == 'illusionFaker':
            state = FAKE
            asyncio.create_task(self._create_fake_ball())
        if player.ability == 'ghostSmasher':
            ball.is_vanish = True
            await self.notifier.broadcast('notifyGhostBall')

        ball.hit_count += 1
        player.reversal_ball(ball)

        return state
    
    def _get_players_to_check(self, ball):
        if self.ball.speed == 0:
            self.is_scored = False
            players_to_check = self.team_left.values() if self.serve_turn == LEFT else self.team_right.values()
        else:
            players_to_check = self.team_left.values() if ball.dx <= 0 else self.team_right.values()
        return players_to_check

    def _is_ball_colliding_with_paddle(self, player, ball):
        if player.is_moving_front() and player.is_colliding_with_ball(ball):
            return True
        return False
    
    def update_target(self, client_id, x, y):
        self.clients[client_id].update_target(x, y)

    async def update_paddle_location(self, client_id, content):
        await self.queue.put((client_id, content))

    ### Game control methods

    async def _end_round(self):
        self.ball.hit_count = 0
        round_win_team = self._add_score()
        self.db_manager.save_round_data(self.round, round_win_team)

        win_team = 'left' if self.ball.dx > 0 else 'right'
        data = {'team' : win_team, 'score' : self.score[win_team]}
        await self.notifier.broadcast('notifyScoreUpdate', data)

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
        self._change_game_state()
        team = 'left' if self.score[LEFT] >= END_SCORE else 'right'
        return team

    def _reset_round(self):
        self.round = self.round + 1
        self.ball.set_ball_to_serve(self.serve_turn, self.board_width, self.board_height)
        for player in self.clients.values():
            player.reset_pos()
        asyncio.create_task(self._send_all_paddle_location())

    def _change_game_state(self):
        self.is_playing = False
        self.is_end = True

    async def _send_real_ball_update(self, ball_state):
        if not self.ball.check_unghost():
            await self.notifier.broadcast('notifyUnghostBall')

        if ball_state == SCORE:
            self.is_scored = True
            self.db_manager.save_hit_map('SCORE', self.ball.pos_y, self. ball.pos_x)
            if self.ball.is_speedtwist:
                await self.notifier.broadcast('notifyUnspeedTwistBall')
            await self._end_round()

        if not self.is_scored:
            await self.notifier.broadcast_ball_location_update()

    async def give_up_game(self, consumer):
        client_id = consumer.client_id
        self.win_team = 'left' if client_id in self.team_left else  'right'
        await self.notifier.broadcast('notifyGameGiveUp', {'clientId': client_id})
        self._change_game_state()

    async def _game_ready_and_start(self):
        data = self.get_game_info()
        await self.notifier.broadcast('notifyGameRoomReady')
        await asyncio.sleep(1.5)
        await self.notifier.broadcast('notifyGameStart', data)
        
    async def _send_all_paddle_location(self):
        for client_id, player in self.clients.items():
            data = {'clientId': client_id, 'xPosition': player.pos_x, 'yPosition': player.pos_y}
            if self.is_playing:
                await self.notifier.broadcast('notifyPaddleLocationUpdate', data)