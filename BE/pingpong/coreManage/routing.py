from django.urls import path
from lobby.consumers import LobbyConsumer
from pingpongRoom.consumers import PingpongRoomConsumer
from user.consumers import GlobalConsumer
from tournamentRoom.consumers import TournamentRoomConsumer

websocket_urlpatterns = [
    path('lobby', LobbyConsumer.as_asgi()),
    path('pingpong-room/<str:room_id>', PingpongRoomConsumer.as_asgi()),
    path('pingpong-room/<str:room_id>/observe', PingpongRoomConsumer.as_asgi()),
    path('', GlobalConsumer.as_asgi()),
    path('tournament-room/<str:tournament_id>', TournamentRoomConsumer.as_asgi()),
]
