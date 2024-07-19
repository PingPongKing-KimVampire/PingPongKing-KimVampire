from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.settings import api_settings
from django.conf import settings
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['nickname'] = user.nickname
        token['user_id'] = user.id
        token['image_uri'] = user.image_uri
        return token

    @classmethod
    def verify_token(cls, token):
        try:
            token_str = token.decode('utf-8')
            token_key = token_str.replace('authorization, ', '')
            decoded_token = jwt.decode(token_key, settings.SECRET_KEY, algorithms=[api_settings.ALGORITHM])
            return decoded_token
        except ExpiredSignatureError:
            raise InvalidTokenError('Token has expired')
        except InvalidTokenError:
            raise InvalidTokenError('Invalid token')