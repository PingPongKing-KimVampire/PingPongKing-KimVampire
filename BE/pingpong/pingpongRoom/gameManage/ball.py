import math
import random

class Ball:
    def __init__(self, speed, radius):
        self.speed = speed
        self.radius = radius
        self.pos_x = 0
        self.pos_y = 0
        self.angle = 0
        self.dx = 0
        self.dy = 0

    def reset_ball(self, x, y, angle):
        self.pos_x = x
        self.pos_y = y
        self.angle = angle
        dir = self._calculate_ball_direction()
        self.dx = dir['dx']
        self.dy = dir['dy']

    def move(self):
        self.pos_x += self.dx
        self.pos_y += self.dy

    def _calculate_ball_direction(self):
        angle_radians = (self.angle * math.pi) / 180
        dx = math.cos(angle_radians) * self.speed
        dy = math.sin(angle_radians) * self.speed
        return {'dx': dx, 'dy': dy}

    def reversal_random(self):
        self.speed = 5
        rand = random.randint(-40, 40)
        self.angle = max(0, min(45, self.angle + rand))
        dir = self._calculate_ball_direction()
        self.dx = dir['dx'] if self.dx < 0 else -dir['dx']
        self.dy = -dir['dy'] if self.dy < 0 else dir['dy']

    def reversal_random_speed_twister(self):
        self.speed = 15
        rand = random.randint(-80, 80)
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
