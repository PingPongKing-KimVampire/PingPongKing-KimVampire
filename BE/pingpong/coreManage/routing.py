from django.urls import path
from authentication.consumers import AuthConsumer
from lobby.consumers import LobbyConsumer
from pingpongRoom.consumers import PingpongRoomConsumer

websocket_urlpatterns = [
    path('ws/', AuthConsumer.as_asgi()),
    path('ws/lobby/', LobbyConsumer.as_asgi()),
    path('ws/pingpong-room/<str:room_id>/', PingpongRoomConsumer.as_asgi()),
]
