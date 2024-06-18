from django.urls import path
from .authConsumers import AuthConsumer
from .lobbyConsumers import LobbyConsumer
from .pingpongRoomConsumers import PingpongRoomConsumer

websocket_urlpatterns = [
    path('ws/', AuthConsumer.as_asgi()),
    path('ws/lobby/', LobbyConsumer.as_asgi()),
    path('ws/pingpong-room/<str:room_id>/', PingpongRoomConsumer.as_asgi()),
]
