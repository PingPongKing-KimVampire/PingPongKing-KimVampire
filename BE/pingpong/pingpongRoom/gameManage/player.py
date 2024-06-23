from utils.printer import Printer

class Player:
    def __init__(self, nickname, ability):
        self.nickname = nickname
        self.pos_x = 0
        self.pos_y = 0
        self.team = None
        self.mode = None
        self.paddle_width = 10
        self.paddle_height = 150
        if ability is not 'human':
            self.set_player_ability(ability) # todo
        
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
        # todo
        pass