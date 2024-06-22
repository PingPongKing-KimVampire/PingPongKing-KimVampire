from django.db import models

class User(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255, null=False)
    image = models.CharField(max_length=255, blank=True, null=True)
    win = models.IntegerField(default=0)
    lose = models.IntegerField(default=0)

class Friendship(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, related_name='friendships', on_delete=models.CASCADE)
    friend = models.ForeignKey(User, related_name='friends', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

class BlockedUser(models.Model):
    id = models.BigAutoField(primary_key=True)
    blocker = models.ForeignKey(User, related_name='blocker', on_delete=models.CASCADE)
    blocked_user = models.ForeignKey(User, related_name='blocked_users', on_delete=models.CASCADE)

class Team(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255, null=False)
    game = models.ForeignKey('Game', related_name='teams', on_delete=models.CASCADE)

class TeamUser(models.Model):
    id = models.BigAutoField(primary_key=True)
    team = models.ForeignKey(Team, related_name='team_members', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='teams', on_delete=models.CASCADE)

class Game(models.Model):
    id = models.BigAutoField(primary_key=True)
    start_at = models.DateTimeField(null=False)
    end_at = models.DateTimeField(blank=True, null=True)

class Round(models.Model):
    id = models.BigAutoField(primary_key=True)
    game = models.ForeignKey(Game, related_name='rounds', on_delete=models.CASCADE)
    win_team = models.ForeignKey(Team, related_name='wins', on_delete=models.CASCADE)

class Message(models.Model):
    id = models.BigAutoField(primary_key=True)
    sender = models.ForeignKey(User, related_name='sent_messages', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='received_messages', on_delete=models.CASCADE)
    content = models.TextField(null=False)
    send_date = models.DateTimeField(null=False)
