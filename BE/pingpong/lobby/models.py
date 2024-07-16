from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from django.core.exceptions import ValidationError

DEFAULT_IMAGE_URI = "images/playerA.png"

class User(models.Model):
    id = models.BigAutoField(primary_key=True)  # Big integer as a primary key
    username = models.CharField(max_length=20, unique=True, null=True)
    password = models.CharField(max_length=100, null=True)
    nickname = models.CharField(max_length=20, unique=True, null=True)
    image_uri = models.URLField(blank=True, null=True)  # Optional field
    win = models.IntegerField(default=0, null=False)
    lose = models.IntegerField(default=0, null=False)
    def __str__(self):
        return self.username
    def set_password(self, raw_password):
        self.password = make_password(raw_password)
    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
    
    def get_id(self):
        return self.id

    def get_nickname(self):
        return self.nickname
    
    def get_username(self):
        return self.username

    def get_image_uri(self):
        if self.image_uri is None:
            return DEFAULT_IMAGE_URI
        return self.image_uri
# class UserProfile(models.Model):
#     user = models.OneToOneField(User, related_name='profile', on_delete=models.CASCADE)
#     bio = models.TextField(blank=True, null=True)
#     date_of_birth = models.DateField(blank=True, null=True)
#     location = models.CharField(max_length=255, blank=True, null=True)
#     join_date = models.DateTimeField(auto_now_add=True)

# class UserStat(models.Model):
#     user = models.OneToOneField(User, related_name='stats', on_delete=models.CASCADE)
#     win = models.IntegerField(default=0)
#     lose = models.IntegerField(default=0)

class Friendship(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, related_name='user', on_delete=models.CASCADE)
    friend = models.ForeignKey(User, related_name='friend', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [
        models.UniqueConstraint(fields=['user', 'friend'], name='unique_friendship')
    ]

class BlockedRelationship(models.Model):
    id = models.BigAutoField(primary_key=True)
    blocker = models.ForeignKey(User, related_name='blocker', on_delete=models.CASCADE)
    blocked_user = models.ForeignKey(User, related_name='blocked_user', on_delete=models.CASCADE)
    class Meta:
        constraints = [
        models.UniqueConstraint(fields=['blocker', 'blocked_user'], name='unique_block_realtionship')
    ]

class Team(models.Model):
    id = models.BigAutoField(primary_key=True)
    kind = models.CharField(max_length=20, default="HUMAN", null=False)
    game = models.ForeignKey('Game', related_name='teams', on_delete=models.CASCADE)
    effect = models.CharField(max_length=20, null=False, default="none")
    score = models.IntegerField(default=0, null=False)

class TeamUser(models.Model):
    id = models.BigAutoField(primary_key=True)
    team = models.ForeignKey(Team, related_name='members', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='teams', on_delete=models.CASCADE)

class Game(models.Model):
    id = models.BigAutoField(primary_key=True)
    mode = models.CharField(max_length=20, default="HUMAN", null=False)
    start_at = models.DateTimeField(null=True)
    end_at = models.DateTimeField(null=True)

    def finish(self):
        self.end_at = timezone.now()

class Round(models.Model):
    id = models.BigAutoField(primary_key=True)
    order = models.IntegerField(null=True)
    game = models.ForeignKey(Game, related_name='rounds', on_delete=models.CASCADE)
    win_team = models.ForeignKey(Team, related_name='wins', on_delete=models.CASCADE)

class BallHit(models.Model):
    id = models.BigAutoField(primary_key=True)
    round = models.ForeignKey(Round, related_name='hits_round', on_delete=models.CASCADE)
    x_coordinate = models.DecimalField(max_digits=10, decimal_places=6)
    y_coordinate = models.DecimalField(max_digits=10, decimal_places=6)
    kind = models.CharField(max_length=20, default="PADDLE", null=False)

    def __str__(self):
        return f"Point({self.x_coordinate}, {self.y_coordinate})"

class Chat(models.Model):
    id = models.BigAutoField(primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)

class ChatUser(models.Model):
    id = models.BigAutoField(primary_key=True)
    chat = models.ForeignKey(Chat, related_name='chat_chat', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='chat_user', on_delete=models.CASCADE)
    class Meta:
        constraints = [
        models.UniqueConstraint(fields=['chat', 'user'], name='unique_chat_user')
    ]

class Message(models.Model):
    id = models.BigAutoField(primary_key=True)
    chat = models.ForeignKey(Chat, related_name='messages', on_delete=models.CASCADE, default=1)
    sender = models.ForeignKey(User, related_name='sender', on_delete=models.CASCADE)
    content = models.TextField(max_length=1000, null=False)
    send_date = models.DateTimeField(null=False, default = timezone.now)
    is_read = models.BooleanField(default=False)