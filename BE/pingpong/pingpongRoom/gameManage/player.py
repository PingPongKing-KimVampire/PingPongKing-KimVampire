class Player:
    def __init__(self, paddle_width=15, paddle_height=150):
        self.pos_x = 0
        self.pos_y = 0
        self.team = None
        self.mode = None
        self.paddle_width = paddle_width
        self.paddle_height = paddle_height
        
    def update_pos(self, x, y):
        self.pos_x = x
        self.pos_y = y
        
    def get_pos(self):
        return self.pos_x, self.pos_y
    
    def set_team(self, team):
        self.team = team
        
    def set_mode(self, mode):
        self.mode = mode