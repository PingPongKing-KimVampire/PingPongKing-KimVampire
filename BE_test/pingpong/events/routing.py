from django.urls import re_path
from .consumers import PingpongConsumer

websocket_urlpatterns = [
    re_path(r'ws/pingpong/$', PingpongConsumer.as_asgi()),
]