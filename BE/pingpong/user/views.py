from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .repositories import UserRepository
import json
import re
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

username_pattern = r'^[A-Za-z0-9]{1,20}$'
nickname_pattern = r'^[A-Za-z가-힣0-9]{1,20}$'
password_pattern = r'^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}:">?<,\-./;\'[\]\\|])[A-Za-z\d!@#$%^&*()_+{}:">?<,\-./;\'[\]\\|]{8,20}$'

def username_is_valid(username):
    return re.match(username_pattern, username) is not None

def password_is_valid(password):
    return re.match(password_pattern, password) is not None

def nickname_is_valid(nickname):
    return re.match(nickname_pattern, nickname) is not None

@require_http_methods(["POST"])
def signup(request):
    try:
        body = request.body.decode('utf-8')
        data = json.loads(body)
    except json.JSONDecodeError:
        return JsonResponse({"error_code": "JSON_01", "error_message": "json parse error"}, status=400)
    username = data.get('username')
    nickname = data.get('nickname')
    password = data.get('password')
    response_data = {
        'username': username,
        'nickname': nickname,
        'password': password,
    }
    if not username_is_valid(username):
        return JsonResponse({"error_code": "USER_01", "error_message": "username is invalid"}, status=400)
    if not password_is_valid(password):
        return JsonResponse({"error_code": "USER_02", "error_message": "password is invalid"}, status=400)
    if not nickname_is_valid(nickname):
        return JsonResponse({"error_code": "USER_03", "error_message": "nickname is invalid"}, status=400)
    user = UserRepository.create_user(username, password, nickname)
    response_data = {
        'userId': user.id
    }
    return JsonResponse(response_data, status=201)



@require_http_methods(["POST"])
def login(request):
    try:
        body = request.body.decode('utf-8')
        data = json.loads(body)
    except json.JSONDecodeError:
        return JsonResponse({"error_code": "JSON_01", "error_message": "json parse error"}, status=400)
    username = data.get('username')
    password = data.get('password')
    response_data = {
        'username': username,
        'password': password,
    }
    if not username_is_valid(username):
        return JsonResponse({"error_code": "USER_01", "error_message": "username is invalid"}, status=400)
    if not password_is_valid(password):
        return JsonResponse({"error_code": "USER_02", "error_message": "password is invalid"}, status=400)
    user = UserRepository.authenticate(username, password)
    if user is not None:
        # 시리얼라이저를 사용하여 토큰 생성
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        access_token = str(refresh.access_token)
        response_data = {
            'user_id': user.id,
        }
        response = JsonResponse(response_data, status=200)
        response['Authorization'] = 'Bearer ' + access_token
        return response
    else:
        return JsonResponse({'detail': 'Invalid credentials'}, status=401)

@require_http_methods(["GET"])
def check_nickname(request):
    nickname = request.GET.get('nickname')
    if UserRepository.exists_user_by_nickname(nickname):
        return JsonResponse({"error_code": "USER_04", "error_message": "nickname is invalid"}, status=400)
    return JsonResponse({"is_availalbe": True}, status=200)

@require_http_methods(["GET"])
def check_username(request):
    username = request.GET.get('username')
    if UserRepository.exists_user_by_username(username):
        return JsonResponse({"error_code": "USER_04", "error_message": "nickname is invalid"}, status=400)
    return JsonResponse({"is_availalbe": True}, status=200)

# views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework import status
from .serializers import CustomTokenObtainPairSerializer
from .repositories import UserRepository
from rest_framework_simplejwt.tokens import RefreshToken

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        username = data.get('username')
        password = data.get('password')
        return self.generate_token_response(username, password)

    def generate_token_response(self, username, password):
        user = UserRepository.authenticate(username, password)

        if user is not None:
            serializer = self.get_serializer(user)
            refresh = serializer.get_token(user)

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class TokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get('refresh')
        try:
            refresh = RefreshToken(refresh_token)
            new_access_token = refresh.access_token
            return Response({'access': str(new_access_token)})
        except TokenError as e:
            return Response({'detail': 'Invalid refresh token'}, status=status.HTTP_400_BAD_REQUEST)

class TokenVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        token = request.data.get('token')
        try:
            AccessToken(token)
            return Response(status=status.HTTP_200_OK)
        except TokenError:
            return Response({'detail': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)