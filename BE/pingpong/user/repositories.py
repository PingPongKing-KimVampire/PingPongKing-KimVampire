from lobby.models import User
from lobby.models import Friendship
from lobby.models import BlockedRelationship
from lobby.models import Message
from django.db import transaction
from asgiref.sync import sync_to_async
from django.db import models, IntegrityError
DEFAULT_IMAGE_URI = "images/playerA.png"

class MessageRepository:
    @staticmethod
    @sync_to_async
    def save_message(sender, receiver, message):
        message_object = Message.objects.create(sender=sender, receiver=receiver, message=message)
        return message_object
    
    @staticmethod
    @sync_to_async
    def get_total_chat_data(sender, receiver):
        messages = Message.objects.filter(sender=sender, receiver=receiver).all()
        message_dtos = []
        for message in messages:
            message_dto = {
                "clientId": message.sender.id,
                "message": message.message
            }
            message_dtos.append(message_dto)
        return message_dtos
    
    @staticmethod
    @sync_to_async
    def get_recent_message_of_friends(user):
        friends = FriendRepository.get_friends_entity(user)
        total_friend_info = [] # 나중에 다시하기
        # for friend in friends:
        #     send_message = Message.objects.select_related('sender', 'receiver').filter(sender=user, receiver=friend).order_by('-send_date').frist()
        #     receive_message = Message.objects.select_related('sender', 'receiver').filter(sender=friend, receiver=user).order_by('-send_date').first()
        #     if send_message is None and receive_message is None:
        #         message = None
        #     elif send_message is not None:
        #         messsage = receive_message
        #     elif receive_message is None:
        #         message = send_message
        #     else:
        #         if send_message.send_date > receive_message.send_date:
        #             message = send_message
        #         else:
        #             message = receive_message
        #     if message is None:
        #         show_message = ""
            
        #     friend_info = {
        #         "id": friend.id,
        #         "nickname": friend.nickname,
        #         "avatarUrl": friend.image_uri,
        #         "message": last_message.message
        #     }
        #     total_friend_info.append(friend_info)
        return total_friend_info
        

class BlockedUserRepository:
    @staticmethod
    @sync_to_async
    def block_user(blocker, blocked_user):
        blockedRelationship = BlockedRelationship.objects.filter(blocker=blocker, blocked_user=blocked_user).first()
        if blocked_user is not None:
            return False
        blockedRelationship.objects.create(blocker=blocker, blocked_user=blocked_user)
        return True
    
    @staticmethod
    @sync_to_async
    def unblock_user(blocker, blocked_user):
        blockedRelationship = BlockedRelationship.objects.filter(blocker=blocker, blocked_user=blocked_user).first()
        if blockedRelationship is None:
            return False
        blockedRelationship.delete()
        return True

    @staticmethod
    @sync_to_async
    def get_blocked_users(blocker):
        blocked_users = BlockedRelationship.objects.select_related('blocker', 'blocked_user').filter(blocker=blocker).all()
        blocked_user_dtos = []
        for blocked_user in blocked_users:
            image_uri = blocked_user.blocked_user.image_uri
            if image_uri is None:
                image_uri = DEFAULT_IMAGE_URI
            blocked_user_dto = {
                "id": blocked_user.blocked_user.id,
                "nickname": blocked_user.blocked_user.nickname,
                "avatarUrl": image_uri
            }
            blocked_user_dtos.append(blocked_user_dto)
        return blocked_user_dtos

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
    def get_friends_entity(user):
        user_friendships = Friendship.objects.select_related('friend', 'user').filter(user=user).all()
        friends = []
        for friendship in user_friendships:
            friend_friendship = Friendship.objects.select_related('friend', 'user').filter(user=friendship.friend, friend=user).first()
            if friend_friendship is not None:
                friends.append(friendship.friend)
        return friends
    
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
        print("내가 보낸 거", friendDtos)
        return friendDtos

    @staticmethod
    @sync_to_async
    def get_friend_receive_request_list(user):
        user_friendships = Friendship.objects.select_related('friend', 'user').filter(friend=user).all()
        friend_dtos = []
        if user_friendships.count() == 0:
            return friend_dtos
        for friendship in user_friendships:
            friend_friendship = Friendship.objects.select_related('friend', 'user').filter(user=user, friend=friendship.user).first()
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
        try:
            Friendship.objects.create(user=user, friend=friend)
        except IntegrityError:
            return True
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
        try:
            Friendship.objects.create(user=user, friend=friend)
        except IntegrityError:
            return False
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
    
    @staticmethod
    @sync_to_async
    def check_friend_relation(user, friend):
        user_to_friend = Friendship.objects.select_related('friend', 'user').filter(user=user, friend=friend).first()
        friend_to_user = Friendship.objects.select_related('friend', 'user').filter(user=friend, friend=user).first()
        if user_to_friend is not None and friend_to_user is not None:
            user_to_friend.delete()
            friend_to_user.delete()
        elif user_to_friend is not None:
            user_to_friend.delete()

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
    
    @staticmethod
    @sync_to_async
    def search_user_by_nickname(nickname):
        users = User.objects.filter(nickname__startswith=nickname).all()
        user_dtos = []
        for user in users:
            image_uri = user.image_uri
            if image_uri is None:
                image_uri = DEFAULT_IMAGE_URI
            user_dto = {
                "id": user.id,
                "nickname": user.nickname,
                "avatarUrl": image_uri
            }
            user_dtos.append(user_dto)
        return user_dtos
    