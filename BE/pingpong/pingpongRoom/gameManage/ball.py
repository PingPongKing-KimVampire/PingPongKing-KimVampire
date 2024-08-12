import math
import random

PADDDLE_MAX_SPEED = 70

MIN_SPEED = 12
MAX_SPEED = 20

NORMAL_ANGLE = 40
SPEEDTWIST_ANGLE = 70
SPEEDTWIST_SPEED_RATIO = 1.5

ANGLE_CORRECTION = 20

MAX_SPIN_TIME = 10
SPIN_DECAY = 0.92
SPIN_EFFECT = 0.1

class Ball:
    def __init__(self, radius=25, hit_count=0):
        self.speed = 0
        self.hit_count = 0
        self.radius = radius
        self.pos_x = 0
        self.pos_y = 0
        self.angle = 0
        self.dx = 0
        self.dy = 0
        self.is_vanish = False
        self.is_speedtwist = False
        self.spin = 0

    def reset_ball(self, x, y):
        self.pos_x = x
        self.pos_y = y
        self.dx = 0
        self.dy = 0

    def move(self):
        self.apply_spin()
        self.pos_x += self.dx
        self.pos_y += self.dy
            
    def apply_spin(self):
        if self.spin == 0:
            return
        
        speed = math.sqrt(self.dx**2 + self.dy**2)
        if speed > 0:
            spin_effect = self.spin * SPIN_EFFECT
            if 0 <= self.angle < 90 or 270 <= self.angle < 360:
                spin_effect = -spin_effect

            perpendicular_dx = -self.dy / speed * spin_effect
            perpendicular_dy = self.dx / speed * spin_effect
            
            self.dx += perpendicular_dx
            self.dy += perpendicular_dy
        
        new_speed = math.sqrt(self.dx**2 + self.dy**2)
        if new_speed > 0:
            self.dx = self.dx / new_speed * speed
            self.dy = self.dy / new_speed * speed
        
        self.spin *= SPIN_DECAY
        if abs(self.spin) < 0.1:
            self.spin = 0
        
        self.update_angle()
    
    def update_angle(self):
        angle = math.degrees(math.atan2(self.dy, self.dx))
        angle = self.correct_angle(angle)
        self.angle = (angle + 360) % 360
    
    def check_unghost(self):
        if self.is_vanish and self.dx < 0 and self.pos_x < 700 or self.is_vanish and self.dx > 0 and self.pos_x > 900:
            self.is_vanish = False
            return False
        return True

    def _calculate_ball_direction(self):
        angle_radians = math.radians(self.angle)
        dx = math.cos(angle_radians) * self.speed
        dy = math.sin(angle_radians) * self.speed
        return {'dx': dx, 'dy': dy}

    def pause(self):
        self.speed = 0

    def change_direction(self, angle):
        self.angle = angle % 360
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
        
    def apply_speed_by_paddle(self, paddle_speed):
        paddle_speed_ratio = paddle_speed / PADDDLE_MAX_SPEED
        speed = MAX_SPEED * paddle_speed_ratio + self.hit_count
        speed = max(MIN_SPEED + self.hit_count, speed)
        return speed
    
    def correct_angle(self, angle):
        if 90 - ANGLE_CORRECTION < angle < 90:
            return 90 - ANGLE_CORRECTION
        elif -90 < angle < -90 + ANGLE_CORRECTION:
            return -90 + ANGLE_CORRECTION
        elif 90 < angle < 90 + ANGLE_CORRECTION:
            return 90 + ANGLE_CORRECTION
        elif -90 - ANGLE_CORRECTION < angle < -90:
            return -90 - ANGLE_CORRECTION
        else:
            return angle

    def apply_angle_by_paddle(self, paddle_dx, paddle_dy):
        if self.speed == 0:
            angle = math.degrees(math.atan2(paddle_dy, paddle_dx))
        else:
            relative_y = paddle_dy - self.dy
            relative_x = paddle_dx - self.dx
            angle = math.degrees(math.atan2(relative_y, relative_x))
        angle = self.correct_angle(angle)
        angle = (angle + 360) % 360
        return angle

    def apply_angle_speedtwist(self, paddle_dx, paddle_dy):
        if self.speed == 0:
            angle = math.degrees(math.atan2(paddle_dy, paddle_dx))
        else:
            relative_y = paddle_dy - self.dy
            relative_x = paddle_dx - self.dx
            angle = math.degrees(math.atan2(relative_y, relative_x))
        if -90 < angle <= 90:
            angle = random.choice([random.randint(-70, 0), random.randint(0, 70)])
            if -70 < angle < 0:
                self.set_spin(-80)
            else:
                self.set_spin(80)
        else:
            angle = random.choice([random.randint(-180, -110), random.randint(110, 180)])
            if -110 < angle < 180:
                self.set_spin(80)
            else:
                self.set_spin(-80)
        angle = (angle + 360) % 360

        return angle

    def set_spin(self, paddle_dy):
        spin_ratio = paddle_dy * 2 / PADDDLE_MAX_SPEED
        new_spin = spin_ratio * MAX_SPIN_TIME
        
        if paddle_dy > 0:
            self.spin = abs(new_spin)
        elif paddle_dy < 0:
            self.spin = -abs(new_spin)
        else:
            self.spin = 0

    def reversal_by_player(self, paddle_dx, paddle_dy, paddle_speed):
        speed = self.apply_speed_by_paddle(paddle_speed)
        self.hit_count += 1
        
        if not self.is_speedtwist:
            self.speed = speed
            self.angle = self.apply_angle_by_paddle(paddle_dx, paddle_dy)
            self.set_spin(paddle_dy)
        else: 
            self.speed = speed * SPEEDTWIST_SPEED_RATIO
            self.angle = self.apply_angle_speedtwist(paddle_dx, paddle_dy)

        angle_rad = math.radians(self.angle)
        self.dx = self.speed * math.cos(angle_rad)
        self.dy = self.speed * math.sin(angle_rad)