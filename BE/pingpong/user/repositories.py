from lobby.models import User
from lobby.models import Friendship
from django.db import transaction
from asgiref.sync import sync_to_async
DEFAULT_IMAGE_URI = "images/playerA.png"
class FriendRepository:
    @staticmethod
    @sync_to_async
    def get_friends(user):
        user_friendships = Friendship.objects.select_related('friend', 'user').filter(user=user).all()
        friendDtos = []
        for friendship in user_friendships:
            friend_friendship = Friendship.objects.select_related('friend', 'user').filter(user=friendship.friend, friend=user).first()
            if friend_friendship is not None:
                image_uri = friendship.friend.image_uri
                if image_uri is None:
                    image_uri = DEFAULT_IMAGE_URI
                freiendDto = {
                    "id": friendship.friend.id,
                    "nickname": friendship.friend.nickname,
                    "avatarUrl": image_uri
                }
                friendDtos.append(freiendDto)
                
        return friendDtos
    
    @staticmethod
    @sync_to_async
    def get_friend_send_request_list(user):
        user_friendships = Friendship.objects.select_related('friend', 'user').filter(user=user).all()
        friendDtos = []
        for friendship in user_friendships:
            friend_friendship = Friendship.objects.filter(user=friendship.friend, friend=user).first()
            if friend_friendship is None:
                image_uri = friendship.friend.image_uri
                if image_uri is None:
                    image_uri = DEFAULT_IMAGE_URI
                friendDto = {
                    "id": friendship.friend.id,
                    "nickname": friendship.friend.nickname,
                    "avatarUrl": image_uri
                }
                friendDtos.append(friendDto)
        return friendDtos

    @staticmethod
    @sync_to_async
    def get_friend_receive_request_list(user):
        user_friendships = Friendship.objects.select_related('friend', 'user').all(friend=user)
        friend_dtos = []
        for friendship in user_friendships:
            friend_friendship = Friendship.objects.select_related('first', 'user').filter(user=friendship.friend, friend=user).first()
            if friend_friendship is None:
                image_uri = friendship.user.image_uri
                if image_uri is None:
                    image_uri = DEFAULT_IMAGE_URI
                friend_dto = {
                    "id": friendship.user.id,
                    "nickname": friendship.user.nickname,
                    "avatarUrl": image_uri
                }
                friend_dtos.append(friend_dto)
        return friend_dtos
    
    @staticmethod
    @sync_to_async
    def send_friend_request(user, friend):
        target_friendship = Friendship.objects.select_related('friend', 'user').filter(user=user, friend=friend).first()
        if target_friendship is not None:
            return True
        Friendship.objects.create(user=user, friend=friend)
        return False
    
    @staticmethod
    @sync_to_async
    def cancel_friend_request(user, friend):
        target_friendship = Friendship.objects.select_related('friend', 'user').filter(user=user, friend=friend).first()
        if target_friendship is None:
            return False
        target_friendship.delete()
        return True
    
    @staticmethod
    @sync_to_async
    def accept_friend_request(user, friend):
        target_friendship = Friendship.objects.select_related('friend', 'user').filter(user=friend, friend=user).first()
        if target_friendship is None:
            return False
        Friendship.objects.create(user=user, friend=friend)
        return True
    
    @staticmethod
    @sync_to_async
    def reject_friend_request(user, friend):
        target_friendship = Friendship.objects.select_related('friend', 'user').first(user=friend, friend=user)
        if target_friendship is None:
            return False
        target_friendship.delete()
        return True
    
    @staticmethod
    @sync_to_async
    def delete_friend(user, friend):
        user_to_friend = Friendship.objects.select_related('friend', 'user').filter(user=user, friend=friend).first()
        friend_to_user = Friendship.objects.select_related('friend', 'user').filter(user=friend, friend=user).first()
        if friend_to_user is None or user_to_friend is None:
            return False
        user_to_friend.delete()
        friend_to_user.delete()
        return True

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
    
    @staticmethod
    @sync_to_async
    def update_user_nickname(user,new_nickname):
        user.nickname = new_nickname
        user.save()
        return user
    