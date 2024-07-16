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
            decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=[api_settings.ALGORITHM])
            print("Decoded Token : ", decoded_token)
            return decoded_token
        except ExpiredSignatureError:
            raise InvalidTokenError('Token has expired')
        except InvalidTokenError:
            raise InvalidTokenError('Invalid token')