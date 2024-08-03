import math
import random

NORMAL_SPEED = 15

NORMAL_ANGLE = 40
SPEEDTWIST_ANGLE = 70

class Ball:
    def __init__(self, speed=NORMAL_SPEED, radius=25, hit_count = 0):
        self.speed = speed
        self.hit_count = 0
        self.radius = radius
        self.pos_x = 0
        self.pos_y = 0
        self.angle = 0
        self.dx = 0
        self.dy = 0
        self.is_vanish = False
        self.is_speedtwist = False

    def reset_ball(self, x, y):
        self.pos_x = x
        self.pos_y = y
        self.dx = 0
        self.dy = 0

    def start_move(self, serve_team):
        speed = NORMAL_SPEED if not self.is_speedtwist else NORMAL_SPEED * 2
        self.speed = speed
        if serve_team == 'left':
            self.angle = 0
        else:
            self.angle = 180
        dir = self._calculate_ball_direction()
        self.dx = dir['dx']
        self.dy = dir['dy']

    def move(self):
        self.pos_x += self.dx
        self.pos_y += self.dy
    
    def check_unghost(self):
        if self.is_vanish and self.dx < 0 and self.pos_x < 517 or self.is_vanish and self.dx > 0 and self.pos_x > 1033:
            self.is_vanish = False
            return False
        return True

    def _calculate_ball_direction(self):
        angle_radians = (self.angle * math.pi) / 180
        dx = math.cos(angle_radians) * self.speed
        dy = math.sin(angle_radians) * self.speed
        return {'dx': dx, 'dy': dy}

    def pause(self):
        self.speed = 0

    def reversal_random(self):
        if not self.is_speedtwist:
            speed, angle = NORMAL_SPEED + self.hit_count, NORMAL_ANGLE
        else: 
            speed, angle = (self.speed + self.hit_count) * 2, SPEEDTWIST_ANGLE
        self.speed = speed
        rand = random.randint(-angle, angle)
        self.angle = max(0, min(45, self.angle + rand))
        dir = self._calculate_ball_direction()
        self.dx = dir['dx'] if self.dx < 0 else -dir['dx']
        self.dy = -dir['dy'] if self.dy < 0 else dir['dy']

    def change_direction(self, angle):
        self.angle = angle
        dir = self._calculate_ball_direction()
        self.dx = dir['dx']
        self.dy = dir['dy']

    def get_right_x(self):
        return self.pos_x + self.radius

    def get_left_x(self):
        return self.pos_x - self.radius

    def get_top_y(self):
        return self.pos_y - self.radius

    def get_bottom_y(self):
        return self.pos_y + self.radius
            
    def set_ball_to_serve(self, serve_team, board_width, board_height):
        if serve_team == 'left':
            serve_position = board_width / 4
        else:
            serve_position = 3 * board_width / 4
        self.reset_ball(serve_position, board_height / 2)
        self.pause()
        
    def set_ball_speed_twist(self):
        self.speed = self.speed * 2
        