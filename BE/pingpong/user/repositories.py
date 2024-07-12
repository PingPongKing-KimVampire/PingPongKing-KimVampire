from lobby.models import User
from lobby.models import Friendship
from lobby.models import BlockedRelationship
from lobby.models import Message
from lobby.models import Chat
from lobby.models import ChatUser
from django.db import transaction
from asgiref.sync import sync_to_async
from django.db import models, IntegrityError


class MessageRepository:
    @staticmethod
    def get_recent_message(sender, receiver):
        chat = ChatRepository.get_common_chat(sender, receiver)
        if chat is None:
            return None, 0
        message = Message.objects.select_related('chat', 'sender').filter(chat=chat).order_by('-send_date').first()
        count = Message.objects.select_related('chat', 'sender').filter(chat=chat, is_read=False, sender=receiver).count()
        return message, count

    @staticmethod
    @sync_to_async
    def save_message(sender, receiver, content):
        chat = ChatRepository.get_common_chat(sender, receiver)
        if chat is None:
            chat = ChatRepository.save_chat(sender, receiver)
        message = Message.objects.create(chat=chat, sender=sender, content=content)
        return message
    
    @staticmethod
    @sync_to_async
    def get_total_chat_data(sender, receiver):
        chat = ChatRepository.get_common_chat(sender, receiver)
        if chat is None:
            return []
        messages = Message.objects.select_related('chat', 'sender').filter(chat=chat).order_by('-send_date').all()
        message_dtos = []
        for message in messages:
            message_dto = {
                "senderId": message.sender.id,
                "content": message.content,
            }
            if message.is_read is False and message.sender is not sender:
                message.is_read = True
                message.save()
            message_dtos.append(message_dto)
        return message_dtos
        
class ChatRepository:
    @staticmethod
    def get_common_chat(user1, user2):
        chat_user_list_by_user1 = ChatUser.objects.select_related('chat', 'user').filter(user=user1).all()
        for chat_user in chat_user_list_by_user1:
            chat_user_another = ChatUser.objects.select_related('chat', 'user').filter(chat=chat_user.chat, user=user2).first()
            if chat_user_another is not None:
                return chat_user.chat
        return None

    @staticmethod
    def save_chat(user1, user2):
        chat = Chat.objects.create()
        ChatUser.objects.create(user=user1, chat=chat)
        ChatUser.objects.create(user=user2, chat=chat)
        return chat

class BlockedUserRepository:
    @staticmethod
    @sync_to_async
    def block_user(blocker, blocked_user):
        blockedRelationship = BlockedRelationship.objects.select_related('blocker', 'blocked_user').filter(blocker=blocker, blocked_user=blocked_user).first()
        if blockedRelationship is not None:
            return True
        try:
            BlockedRelationship.objects.create(blocker=blocker, blocked_user=blocked_user)
        except IntegrityError:
            return True
        return False
    
    @staticmethod
    @sync_to_async
    def unblock_user(blocker, blocked_user):
        blockedRelationship = BlockedRelationship.objects.select_related('blocker', 'blocked_user').filter(blocker=blocker, blocked_user=blocked_user).first()
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
            blocked_user_dto = {
                "id": blocked_user.blocked_user.id,
                "nickname": blocked_user.blocked_user.nickname,
                "avatarUrl": blocked_user.blocked_user.get_image_uri()
            }
            blocked_user_dtos.append(blocked_user_dto)
        return blocked_user_dtos

class FriendRepository:
    @staticmethod
    @sync_to_async
    def get_friends(user, channel_name_map):
        user_friendships = Friendship.objects.select_related('friend', 'user').filter(user=user).all()
        friendDtos = []
        for friendship in user_friendships:
            friend_friendship = Friendship.objects.select_related('friend', 'user').filter(user=friendship.friend, friend=user).first()
            if friend_friendship is not None:
                message, count = MessageRepository.get_recent_message(user, friendship.friend)
                if friendship.friend.id in channel_name_map:
                    active_state = "ACTIVE"
                else:
                    active_state = "INACTIVE"
                freiendDto = {
                    "id": friendship.friend.id,
                    "nickname": friendship.friend.nickname,
                    "avatarUrl": friendship.friend.get_image_uri(),
                    "activeState": active_state,
                    "chat": {
                        "recentMessage": message.content if message is not None else "",
                        "recentTimestamp": message.send_date.isoformat() if message is not None else "",
                        "unreadMessageCount": count,
                    }
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
                friendDto = {
                    "id": friendship.friend.id,
                    "nickname": friendship.friend.nickname,
                    "avatarUrl": friendship.friend.get_image_uri()
                }
                friendDtos.append(friendDto)
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
                friend_dto = {
                    "id": friendship.user.id,
                    "nickname": friendship.user.nickname,
                    "avatarUrl": friendship.user.get_image_uri()
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
            return "FRIEND"
        elif user_to_friend is not None:
            user_to_friend.delete()
            return "FRIEND_REQUEST"
        return None

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
    def get_user_by_id_sync(id):
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
            user_dto = {
                "id": user.id,
                "nickname": user.nickname,
                "avatarUrl": user.get_image_uri()
            }
            user_dtos.append(user_dto)
        return user_dtos
    