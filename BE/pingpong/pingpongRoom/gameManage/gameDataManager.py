from pingpongRoom.repositories import GameRepository
from django.utils import timezone
import copy

LEFT = 'left'
RIGHT = 'right'

class GameDataManager:
    def __init__(self, left_mode='human', right_mode='human'):
        self.game_data = {}

        # before start info
        self.left_mode = left_mode
        self.right_mode = right_mode
        self.left_ability = None
        self.right_ability = None
        self.team_left = None
        self.team_right = None

        # game info
        self.start_time = None
        self.end_time = None
        self.round_hit_map = []

    def set_teams_info(self, team_left, team_right, left_ability=None, right_ability=None):
        self.team_left = self.make_team_array(team_left)
        self.team_right = self.make_team_array(team_right)
        self.left_ability = left_ability
        self.right_ability = right_ability

    async def save_data_to_db(self, score, win_team):
        data = {
            "start_time" : self.start_time,
            "end_time" : self.end_time,
            "mode": self._get_game_mode(),
            "team1_users": self.team_left,
            "team1_kind": self.left_mode,
            "team2_users": self.team_right,
            "team2_kind": self.right_mode,
            "team1_ability": self.left_ability,
            "team2_ability": self.right_ability,
            "win_team" : win_team,
            "team1_score" : score[LEFT],
            "team2_score" : score[RIGHT],
            "round": self.game_data
        }
        print(data)
        game = await GameRepository.save_game_async(data)
        # game None 처리 필요

        # # Gamn DB Test, 지울 것.
        # game = await GameRepository.get_games_by_user_id(self.clients[0])
        # print(game)

    def set_start_time(self):
        self.start_time = timezone.now()

    def set_end_time(self):
        self.end_time = timezone.now()
        
    def save_round_data(self, round, round_win_team):
        data = {
            'win_team' : round_win_team,
            'ball_hits' : copy.deepcopy(self.round_hit_map)
        }
        self.game_data[round] = data
        self.round_hit_map = []

    def save_hit_map(self, type, y, x):
        data = {
            'y' : y,
            'x' : x,
            'type' : type
        }
        self.round_hit_map.append(data)

    def _get_game_mode(self):
        if self.left_mode == 'human' and self.right_mode == 'human':
            mode = 'HUMAN_HUMAN'
        elif self.left_mode == 'vampire' and self.right_mode == 'human':
            mode = 'VAMPIRE_HUMAN'
        else:
            mode = 'VAMPIRE_VAMPIRE'
        return mode
    
    def make_team_array(self, team_list):
        data = []
        for client_id, player in team_list.items():
            data.append(client_id)
        return data