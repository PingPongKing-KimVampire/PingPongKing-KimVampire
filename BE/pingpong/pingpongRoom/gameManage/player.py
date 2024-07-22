from utils.printer import Printer

class Player:
    def __init__(self, nickname, ability, team, image_uri):
        self.nickname = nickname
        self.image_uri = image_uri
        self.ready_state = 'NOTREADY'

        self.team = team
        self.ability = ability
        
        self.pos_x = 0
        self.pos_y = 0
        self.dx = 0
        self.dy = 0
        self.target_x = 0
        self.target_y = 0
        self.paddle_width = 10
        self.paddle_height = 150

        self.max_speed = 30
        self.current_speed = 0
        self.acceleration = 1.6
        self.deceleration = 15

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
        if self.is_ball_in_paddle_y_range(ball):
            if self.is_ball_in_paddle_x_range(ball):
                return True

    def is_ball_in_paddle_y_range(self, ball):
        return ball.pos_y >= self.pos_y - self.paddle_height / 2 \
                and ball.pos_y <= self.pos_y + self.paddle_height / 2

    def is_ball_in_paddle_x_range(self, ball):
        if self.team == 'left' and ball.dx <= 0 and ball.get_left_x() <= self.pos_x + self.paddle_width / 2:
            return True
        elif self.team == 'right' and ball.dx >= 0 and ball.get_right_x() >= self.pos_x - self.paddle_width / 2:
            return True
        return False

    def _calculate_distance(self):
        return ((self.target_x - self.pos_x) ** 2 + (self.target_y - self.pos_y) ** 2) ** 0.5

    def move(self):
        self.pos_x += self.dx
        self.pos_y += self.dy
        return self.pos_x, self.pos_y

    def needs_update(self):
        distance = self._calculate_distance()
        if distance < 1:
            self.dx = 0
            self.dy = 0
            self.current_speed = 0
            return False

        target_speed = min(self.max_speed, distance)
        
        if self.current_speed < target_speed:
            self.accelerate()
        else:
            self.decelerate()

        direction_x = (self.target_x - self.pos_x) / distance
        direction_y = (self.target_y - self.pos_y) / distance

        self.dx = direction_x * self.current_speed
        self.dy = direction_y * self.current_speed
        # print(f"dx : {self.dx}, dy : {self.dy}")

        return True
    
    def accelerate(self):
        self.current_speed = min(self.max_speed, self.current_speed + self.acceleration)

    def decelerate(self):
        self.current_speed = max(0, self.current_speed - self.deceleration)

            
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