from utils.printer import Printer

class Player:
    def __init__(self, nickname, ability, team, image_uri):
        self.nickname = nickname
        self.team = team
        self.image_uri = image_uri
        self.ready_state = 'NOTREADY'
        self.pos_x = 0
        self.pos_y = 0
        self.dx = 0
        self.dy = 0
        self.target_x = 0
        self.target_y = 0
        self.max_speed = 15
        self.paddle_width = 10
        self.paddle_height = 150
        self.ability = ability

    def set_state(self, state):
        self.ready_state = state
        
    def get_state(self):
        return self.ready_state
        
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

    def reset_pos(self):
        if self.team == 'left':
            x = 1550 / 4
        else:
            x = 1550 / 4 * 3
        y = 1000 / 2
        self.pos_x = x
        self.pos_y = y
        self.target_x = x
        self.target_y = y

    def _calculate_distance(self):
        return ((self.target_x - self.pos_x) ** 2 + (self.target_y - self.pos_y) ** 2) ** 0.5

    def move(self):
        self.pos_x += self.dx
        self.pos_y += self.dy
        return self.pos_x, self.pos_y

    def needs_update(self):
        distance = self._calculate_distance()
        if distance < 1:
            return False
        speed = min(self.max_speed, distance)
        self.dx = (self.target_x - self.pos_x) / distance * speed
        self.dy = (self.target_y - self.pos_y) / distance * speed
        # if ( self.dx ** 2 + self.dy ** 2 ) ** 0.5 > self.max_speed:
        #     Printer.log(f"Player {self.nickname} speed is too fast", "yellow")
        #     return False
        return True
            
    def update_target(self, x, y):
        self.target_x = x
        self.target_y = y

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