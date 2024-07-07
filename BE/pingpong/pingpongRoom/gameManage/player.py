from utils.printer import Printer

class Player:
    def __init__(self, nickname, ability, team, player_count=1):
        self.nickname = nickname
        self.pos_x = 0
        self.pos_y = 0
        self.target_x = 0
        self.target_y = 0
        self.max_speed = 20
        self.team = team
        self.ability = ability
        self.paddle_width, self.paddle_height = self.set_paddle_size(player_count)

    def set_paddle_size(self, player_count):
        if player_count == 1:
            return 10, 150
        elif player_count == 2:
            return 9, 120
        elif player_count == 3:
            return 8, 100
        elif player_count == 4:
            return 7, 80
        else:
            return 5, 50

    def _calculate_distance(self):
        return ((self.target_x - self.pos_x) ** 2 + (self.target_y - self.pos_y) ** 2) ** 0.5

    def move(self):
        distance = self._calculate_distance()
        
        if distance > self.max_speed:
            pos_x = self.pos_x + (self.target_x - self.pos_x) * self.max_speed / distance
            pos_y = self.pos_y + (self.target_y - self.pos_y) * self.max_speed / distance
        else:
            pos_x = self.target_x
            pos_y = self.target_y
        self.update_pos(pos_x, pos_y)
            
    def update_target(self, x, y):
        self.target_x = x
        self.target_y = y

    def update_pos(self, x, y):
        self.pos_x = x
        self.pos_y = y
        
    def get_pos(self):
        return self.pos_x, self.pos_y
    
    def set_team(self, team):
        self.team = team
        
    def set_mode(self, mode):
        self.mode = mode

    def modify_paddle_size(self, size):
        if size == 'small':
            self.set_paddle_small()
        elif size == 'big':
            self.set_paddle_big()
        
    def set_paddle_small(self):
        self.paddle_height = self.paddle_height / 1.5
        # self.paddle_width = self.paddle_width / 1

    def set_paddle_big(self):
        self.paddle_height = self.paddle_height * 2
        self.paddle_width = self.paddle_width * 4