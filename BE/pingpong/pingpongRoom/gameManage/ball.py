import math
import random

NORMAL_SPEED = 15

NORMAL_ANGLE = 40
SPEEDTWIST_ANGLE = 70
SPEEDTWIST_SPEED_RATIO = 1.5

ANGLE_CORRECTION = 20

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

    def move(self):
        self.pos_x += self.dx
        self.pos_y += self.dy
    
    def check_unghost(self):
        if self.is_vanish and self.dx < 0 and self.pos_x < 700 or self.is_vanish and self.dx > 0 and self.pos_x > 900:
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

    def change_direction(self, angle):
        self.angle = angle
        dir = self._calculate_ball_direction()
        self.dx = dir['dx']
        self.dy = dir['dy']

    def get_angle(self):
        movement_influence = math.atan2(self.dy, self.dx)
        movement_angle = math.degrees(movement_influence)
        movement_angle = (movement_angle + 270) % 360
        return movement_angle

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

    def correction_angle(self, angle):
        if 360 - ANGLE_CORRECTION < angle < 360:
            return 360 - ANGLE_CORRECTION
        elif 0 < angle < ANGLE_CORRECTION:
            return ANGLE_CORRECTION
        elif 180 < angle < 180 + ANGLE_CORRECTION:
            return 180 + ANGLE_CORRECTION
        elif 180 - ANGLE_CORRECTION < angle < 180:
            return 180 - ANGLE_CORRECTION
        elif angle in (0, 180):
            return None
        return angle
    
    def apply_collision(self, paddle_angle):
        ball_angle = self.get_angle()
        
        if not (0 <= ball_angle < 360):
            return None
        
        if not (0 <= paddle_angle < 360):
            return None
        
        if 0 <= ball_angle < 180:
            reflected_angle = 360 - ball_angle
        else:  # 180 <= ball_angle < 360
            reflected_angle = 360 - ball_angle
        
        if 0 <= paddle_angle < 180:
            adjustment = (paddle_angle - 90) / 2
        else:  # 180 <= paddle_angle < 360
            adjustment = (paddle_angle - 270) / 2
        
        final_angle = (reflected_angle + adjustment) % 360
        
        return final_angle

    def reversal_by_player(self, paddle_angle):
        if not self.speed == 0:
            angle = self.apply_collision(paddle_angle)
        else:
            angle = paddle_angle
        if angle == None:
            return
        angle = self.correction_angle(angle)
        if angle == None:
            return

        angle = (angle - 270) % 360
        if angle > 180:
            angle -= 360
        
        if not self.is_speedtwist:
            self.speed = NORMAL_SPEED + self.hit_count
            self.angle = angle
        else: 
            self.speed = (NORMAL_SPEED + self.hit_count) * SPEEDTWIST_SPEED_RATIO
            rand = random.randint(-SPEEDTWIST_ANGLE, SPEEDTWIST_ANGLE)
            self.angle = rand
        
        dir = self._calculate_ball_direction()
        self.dx = dir['dx']
        self.dy = dir['dy']
