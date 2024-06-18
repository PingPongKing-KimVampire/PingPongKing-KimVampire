from django.db import models
import uuid

class PingpongClient(models.Model):
    client_id = models.CharField(max_length=255, unique=True)
    nickname = models.CharField(max_length=255)
    is_init = models.BooleanField(default=False)

class PingPongRoom(models.Model):
    room_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referee_client = models.ForeignKey(PingpongClient, related_name='referee', on_delete=models.CASCADE)
    players = models.ManyToManyField(PingpongClient, related_name='players')