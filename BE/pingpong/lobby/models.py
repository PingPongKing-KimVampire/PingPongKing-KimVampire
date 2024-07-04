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
        models.UniqueConstraint(fields=['blocker', 'blocked_user'], name='unique_friendship')
    ]

# class Team(models.Model):
#     id = models.BigAutoField(primary_key=True)
#     name = models.CharField(max_length=255, null=False)
#     game = models.ForeignKey('Game', related_name='teams', on_delete=models.CASCADE)

# class TeamUser(models.Model):
#     id = models.BigAutoField(primary_key=True)
#     team = models.ForeignKey(Team, related_name='members', on_delete=models.CASCADE)
#     user = models.ForeignKey(User, related_name='teams', on_delete=models.CASCADE)

# class Game(models.Model):
#     id = models.BigAutoField(primary_key=True)
#     start_at = models.DateTimeField(null=False)
#     end_at = models.DateTimeField(blank=True, null=True)

# class Round(models.Model):
#     id = models.BigAutoField(primary_key=True)
#     game = models.ForeignKey(Game, related_name='rounds', on_delete=models.CASCADE)
#     win_team = models.ForeignKey(Team, related_name='wins', on_delete=models.CASCADE)

# class Match(models.Model):
#     id = models.BigAutoField(primary_key=True)
#     game = models.ForeignKey(Game, related_name='matches', on_delete=models.CASCADE)
#     user = models.ForeignKey(User, related_name='matches', on_delete=models.CASCADE)
#     team = models.ForeignKey(Team, related_name='team_matches', on_delete=models.CASCADE)
#     is_win = models.BooleanField(default=False)
#     created_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         indexes = [
#             models.Index(fields=['user', '-created_at']),  # 유저별 최근 경기를 빠르게 조회하기 위해 인덱스 추가
#         ]

class Message(models.Model):
    id = models.BigAutoField(primary_key=True)
    sender = models.ForeignKey(User, related_name='sender', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='receiver', on_delete=models.CASCADE)
    content = models.TextField(null=False)
    send_date = models.DateTimeField(null=False, default = timezone.now)