from django.urls import path
from lobby.consumers import LobbyConsumer
from pingpongRoom.consumers import PingpongRoomConsumer
from user.consumers import GlobalConsumer
from tournamentRoom.consumers import TournamentRoomConsumer

websocket_urlpatterns = [
    path('ws/lobby/', LobbyConsumer.as_asgi()),
    path('ws/pingpong-room/<str:room_id>/', PingpongRoomConsumer.as_asgi()),
    path('ws/', GlobalConsumer.as_asgi()),
    path('ws/tournament-room/<str:tournament_id>/', TournamentRoomConsumer.as_asgi()),
]
