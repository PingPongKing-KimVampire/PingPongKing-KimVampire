from lobby.models import User
from django.db import transaction
from asgiref.sync import sync_to_async

class UserRepository:
    def authenticate(username, password):
        user = User.objects.filter(username=username).first()
        if user is None:
            return None
        if user.check_password(password):
            return user
        return None
    @staticmethod
    @sync_to_async
    def get_user_by_id(id):
        return User.objects.filter(id=id).first()

    @staticmethod
    def get_user_by_username(username):
        return User.objects.filter(username=username).first()

    @staticmethod
    def exists_user_by_username(username):
        return User.objects.filter(username=username).exists()
    
    @staticmethod
    def exists_user_by_nickname(nickname):
        return User.objects.filter(nickname=nickname).exists()

    @staticmethod
    @sync_to_async
    def exists_user_by_nickname_async(nickname):
        return User.objects.filter(nickname=nickname).exists()
    
    @staticmethod
    def get_user_by_nickname(nickname):
        return User.objects.filter(nickname=nickname).first()
    @staticmethod
    def create_user(username, password, nickname):
        user = User(username=username, nickname=nickname)
        user.set_password(password)
        user.save()
        return user

    @staticmethod
    def update_user_nickname(user, new_nickname):
        user.nickname = new_nickname
        user.save()
        return user

    
    @staticmethod
    @sync_to_async
    def update_user_image_uri(user, new_image_uri):
        user.image_uri = new_image_uri
        user.save()
        return user
    
    @staticmethod
    @sync_to_async
    def update_user_image_uri_and_nickname(user, new_image_uri, new_nickname):
        user.nickname = new_nickname
        user.image_uri = new_image_uri
        user.save()
        return user

    @staticmethod
    def delete_user(user):
        user.delete()
    