from utils.printer import Printer

MAX_SPEED = 70
SENSITIVE_FACTOR = 7

class Player:
    def __init__(self, nickname, ability, team, image_uri):
        self.nickname = nickname
        self.image_uri = image_uri
        self.ready_state = 'NOTREADY'

        self.team = team
        self.ability = ability
        
        self.previous_x = 0
        self.previous_y = 0
        self.pos_x = 0
        self.pos_y = 0
        self.dx = 0
        self.dy = 0
        self.target_x = 0
        self.target_y = 0
        self.paddle_width = 10
        self.paddle_height = 150

    def set_state(self, state):
        self.ready_state = state
        
    def get_state(self):
        return self.ready_state
        
    def set_paddle_size(self, player_count): # 필요한지 체크
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
            x = 1550 / 6
        else:
            x = 1550 / 6 * 5
        y = 1000 / 2
        self.pos_x = x
        self.pos_y = y
        self.target_x = x
        self.target_y = y

    def is_moving_front(self):
        if self.team == 'left':
            return self.dx > 0
        else:
            return self.dx < 0

    def is_colliding_with_ball(self, ball):
        steps = 50 # 성능 문제 생기면 조절 할 것
        for i in range(steps):
            t = i / steps
            interpolated_x = self.previous_x + (self.pos_x - self.previous_x) * t
            interpolated_y = self.previous_y + (self.pos_y - self.previous_y) * t
            if self._check_collision_at_position(ball, interpolated_x, interpolated_y):
                return True
        return False

    def _check_collision_at_position(self, ball, paddle_x, paddle_y):
        if (ball.pos_y >= paddle_y - self.paddle_height / 2 and
            ball.pos_y <= paddle_y + self.paddle_height /2):
            if self.team == 'left':
                return (ball.get_left_x() <= paddle_x + self.paddle_width and 
                        ball.get_left_x() >= paddle_x - self.paddle_width)
            else:
                return (ball.get_right_x() >= paddle_x - self.paddle_width and 
                        ball.get_right_x() <= paddle_x + self.paddle_width)
        return False

    def _calculate_distance(self):
        return ((self.target_x - self.pos_x) ** 2 + (self.target_y - self.pos_y) ** 2) ** 0.5

    def move(self):
        self.previous_x, self.previous_y = self.pos_x, self.pos_y
        self.pos_x += self.dx
        self.pos_y += self.dy
        return self.pos_x, self.pos_y

    def needs_update(self):
        distance = self._calculate_distance()
        
        if distance > 1:
            speed = min(MAX_SPEED, distance / SENSITIVE_FACTOR)
            self.dx = (self.target_x - self.pos_x) / distance * speed
            self.dy = (self.target_y - self.pos_y) / distance * speed
            return True
        else:
            speed = 0
            self.dx = 0
            self.dy = 0
            return False
        
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