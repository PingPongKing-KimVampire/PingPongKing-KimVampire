class Player:
    def __init__(self, paddle_width=15, paddle_height=150):
        self.posX = 0
        self.posY = 0
        self.team = None
        self.paddle_width = paddle_width
        self.paddle_height = paddle_height
        
    def update_pos(self, x, y):
        self.posX = x
        self.posY = y
        
    def get_pos(self):
        return self.posX, self.posY