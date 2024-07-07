from utils.printer import Printer

class Player:
    def __init__(self, nickname, ability, team, player_count=1):
        self.nickname = nickname
        self.pos_x = 0
        self.pos_y = 0
        self.team = team
        self.ability = ability
        self.paddle_width, self.paddle_height = self.set_paddle_size(player_count)
        if self.ability is not 'human':
            self.set_player_ability(self.ability) # todo
    
    def set_paddle_size(self, player_count):
        if player_count == 1:
            return 10, 150
        board_width = 1550
        board_height = 1000
        base_paddle_height = 150
        min_paddle_height = 50
        
        paddle_height = max(base_paddle_height / player_count, min_paddle_height)
        paddle_width = 150
        
        return paddle_width, paddle_height
        
    def update_pos(self, x, y):
        self.pos_x = x
        self.pos_y = y
        
    def get_pos(self):
        return self.pos_x, self.pos_y
    
    def set_team(self, team):
        self.team = team
        
    def set_mode(self, mode):
        self.mode = mode

    def set_player_ability(self, ability):
        if ability == 'human':
            return
        elif ability == 'jiantBlocker':
            pass
        elif ability == 'speedTwister':
            pass
        elif ability == 'illusionFaker':
            pass
        elif ability == 'ghostSmasher':
            pass
        
    def set_paddle_small(self):
        self.paddle_height = self.paddle_height / 2
        self.paddle_width = self.paddle_width / 2

    def set_paddle_big(self):
        self.paddle_height = self.paddle_height * 2
        self.paddle_width = self.paddle_width * 2