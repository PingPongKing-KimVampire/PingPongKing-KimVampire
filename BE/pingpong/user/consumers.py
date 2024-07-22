from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
from utils.printer import Printer
from coreManage.stateManager import StateManager
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
import os
import base64
import uuid
from django.core.files.base import ContentFile
from django.conf import settings
from coreManage.group import add_group, discard_group, notify_group, notify_client_event
MAX_URI_LENGTH = 200
stateManager = StateManager()
DEFAULT_IMAGE_URI = "images/playerA.png"
DEFAULT_IMAGE_STORAGE = "../BE/data_image/"

channel_name_map = {}

class GlobalConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        from .serializers import CustomTokenObtainPairSerializer
        self.is_init = True
        self.read_receiver_id = None
        headers = dict(self.scope['headers'])
        token = headers.get(b'sec-websocket-protocol', b'')
        try:
            self.decoded_token = CustomTokenObtainPairSerializer.verify_token(token)
            await self.accept(subprotocol="authorization")
            Printer.log("WebSocket connection established", "green")      
        except (InvalidTokenError, ExpiredSignatureError, KeyError, AttributeError):
            Printer.log("Invalid Authorization header, closing connection", "red")
            await self.close()

    async def disconnect(self, close_code):
        if self.is_init:
            self.is_init = False
        if hasattr(self, 'client_id') and self.client_id in channel_name_map:
            content = {
                "clientId": self.client_id,
                "activeState": "INACTIVE"
            }
            channel_name_map.pop(self.client_id)
            await discard_group(self, 'lobby')
            await self.notify_all_group_activation("notify_friend_active_state_change", content)
            Printer.log("notify inactivated to all friends", "red")
        Printer.log("WebSocket connection closed", "red")
        
    async def _send(self, event, content):
        Printer.log(f">>>>> AUTH sent >>>>>", "cyan")
        Printer.log(f"event : {event}", "cyan")
        # Printer.log(f"content : {content}", "cyan")
        await self.send(json.dumps({ 'event': event, 'content': content }))

    async def receive(self, text_data):
        message = json.loads(text_data)
        event = message.get('event')
        content = message.get('content')
        Printer.log("<<<<<")
        Printer.log(f"event : {event}")
        Printer.log(f"content : {content}")

        if event == 'initClient':
            await self.init_client()
            return
        if event == 'updateClientInfo':
            waiting_room_info = content['waitingRoomInfo']
            await self.updateClientInfo(waiting_room_info)
        elif event == 'getFriendList':
            await self.get_friends()
        elif event == 'getClientListWhoFriendRequestedMe':
            await self.get_friend_receive_request_list()
        elif event == 'getClientListIFriendRequested':
            await self.get_friend_send_request_list()
        elif event == 'sendFriendRequest':
            friend_id = content['clientInfo']['id']
            await self.send_friend_request(friend_id) 
        elif event == 'cancelFriendRequest':
            friend_id = content['clientInfo']['id']
            await self.cancel_friend_request(friend_id)
        elif event == 'acceptFriendRequest':
            friend_id = content['clientInfo']['id']
            await self.accept_friend_request(friend_id)
        elif event == 'rejectFriendRequest':
            friend_id = content['clientInfo']['id']
            await self.reject_friend_request(friend_id)
        elif event == 'deleteFriend':
            friend_id = content['clientInfo']['id']
            await self.delete_friend(friend_id)
        elif event == 'blockClient':
            target_user_id = content['clientInfo']['id']
            await self.block_client(target_user_id)
        elif event == 'unblockClient':
            target_user_id = content['clientInfo']['id']
            await self.unblock_client(target_user_id)
        elif event == 'searchClient':
            keyword = content['keyword']
            await self.search_client(keyword)
        elif event == 'sendMessage':
            receiver_id = content['clientId']
            message = content['message']
            await self.send_message(receiver_id, message)
        elif event == 'getTotalChatData':
            receiver_id = content['clientId']
            await self.get_total_chat_data(receiver_id)
        elif event == 'stopReadingChat':
            receiver_id = content['clientId']
            await self.stop_reading_chat(receiver_id)
        elif event == 'getClientListIBlocked':
            await self.get_client_list_blocked_by_user()
        elif event == 'getClientProfiile':
            client_id = content['clientId']
            await self.get_client_profile(client_id)
        elif event == 'getClientGameDetail':
            client_id = content['clientId']
            game_id = content['gameId']
            await self.get_client_game_detail(client_id, game_id)

    async def get_client_profile(self, client_id):
        from pingpongRoom.repositories import GameReadRepository
        data = await GameReadRepository.get_game_history_by_user_id_async(client_id)
        await self._send("getClientProfileResponse", data)
    
    async def get_client_game_detail(self, client_id, game_id):
        from pingpongRoom.repositories import GameReadRepository
        data = await GameReadRepository.get_game_detail_by_user_id_and_game_id_async(client_id, game_id)
        await self._send("getClientGameDetailResponse", data)

    async def init_client(self):
        from .repositories import UserRepository
        # try:
        #     decoded_token = CustomTokenObtainPairSerializer.verify_token(access_token)
        # except (InvalidTokenError, ExpiredSignatureError, KeyError, AttributeError):
        #     Printer.log("Invalid Authorization header, closing connection", "red")
        #     self.is_init = False
        #     if (hasattr(self, 'client_id') and self.client_id in channel_name_map):
        #         channel_name_map.pop(self.client_id)
        #     discard_group(self, 'lobby')
        #     await self.close()
        stateManager.add_channel_layer(self.channel_layer)
        client_id = self.decoded_token['user_id']
        
        self.client_id = client_id
        self.client_nickname = self.decoded_token['nickname']
        # add user 회원가입에서 이루어짐, 추후에 알림 기능 적용을 위해서 채널 만들고 관리할 필요 있음
        # stateManager.add_user(client_id, decoded_token['nickname'])
        user = await UserRepository.get_user_by_id(client_id)
        response = {
            "id": client_id,
            "nickname": user.nickname,
            "avatarUrl": user.get_image_uri(),
            "message": "OK"
        }
        channel_name_map[self.client_id] = self.channel_name
        content = {
                "clientId": self.client_id,
                "activeState": "ACTIVE"
        }
        await self.notify_all_group_activation("notify_friend_active_state_change", content)
        await self._send('initClientResponse', response)

    async def updateClientInfo(self, waiting_room_info):
        from .repositories import UserRepository
        if 'nickname' not in waiting_room_info and 'avatarImage' not in waiting_room_info:
            await self._send("updateClientInfoResponse", {"message": "invalidAvatarImage"})
            return
        if 'avatarImage' not in waiting_room_info and waiting_room_info['nickname'] is not None:
            user = await UserRepository.get_user_by_id(self.client_id)
            await UserRepository.update_user_nickname(user, waiting_room_info['nickname'])
            await self._send("updateClientInfoResponse", {"message": "OK"})
            return
        avatar_image = waiting_room_info['avatarImage']
        if 'imageUrl' not in avatar_image and avatar_image['imageData'] is not None:
            target_image_uri =  await self.upload_image(avatar_image['imageData'])
            if len(target_image_uri) >= MAX_URI_LENGTH:
                await self._send("updateClientInfoResponse", {"message": "longURILength"})
                return 
        elif avatar_image['imageUrl'] is not None and 'imageData' not in avatar_image:
            target_image_uri = avatar_image['imageUrl']
        else:
            await self._send("updateClientInfoResponse", {"message": "invalidAvatarImage"})
            return
        if "nickname" not in waiting_room_info:
            user = await UserRepository.get_user_by_id(self.client_id)
            await UserRepository.update_user_image_uri(user, target_image_uri)
            await self._send("updateClientInfoResponse", {"message": "OK"})
        else:
            nickname = waiting_room_info['nickname']
            isDuplicated = await UserRepository.exists_user_by_nickname_async(nickname)
            if isDuplicated:
                await self._send("updateClientInfoResponse", {"message": "duplicatedNickname"})
                return
            user = await UserRepository.get_user_by_id(self.client_id)
            await UserRepository.update_user_image_uri_and_nickname(user, target_image_uri, nickname)
            await self._send("updateClientInfoResponse", {"message": "OK"})
    
    async def upload_image(self, image_data):
        format, imgstr = image_data.split(';base64,')
        ext = format.split('/')[-1]
        file_name = f'{uuid.uuid4()}.{ext}'
        data = ContentFile(base64.b64decode(imgstr), name=file_name)
        file_path = os.path.join(settings.MEDIA_ROOT, data.name)
        with open(file_path, 'wb') as f:
            f.write(data.read())
        file_url = os.path.join(settings.MEDIA_URL, file_name)
        return file_url

    async def get_friends(self):
        from .repositories import FriendRepository
        from .repositories import UserRepository
        user = await UserRepository.get_user_by_id(self.client_id)
        friends = await FriendRepository.get_friends(user, channel_name_map)
        await self._send("getFriendListResponse", {"message": "OK", "clientList": friends})
    
    async def get_friend_receive_request_list(self):
        from .repositories import FriendRepository
        from .repositories import UserRepository
        user = await UserRepository.get_user_by_id(self.client_id)
        received_friend_requests = await FriendRepository.get_friend_receive_request_list(user)
        await self._send("getClientListWhoFriendRequestedMeResponse", {"message": "OK", "clientList": received_friend_requests})
    
    async def get_friend_send_request_list(self):
        from .repositories import FriendRepository
        from .repositories import UserRepository
        user = await UserRepository.get_user_by_id(self.client_id)
        sending_friend_requests = await FriendRepository.get_friend_send_request_list(user)
        await self._send("getClientListIFriendRequestedResponse", {"message": "OK", "clientList": sending_friend_requests})
    
    async def send_friend_request(self, friend_id):
        from .repositories import FriendRepository
        from .repositories import UserRepository
        user = await UserRepository.get_user_by_id(self.client_id)
        friend = await UserRepository.get_user_by_id(friend_id)
        if friend is None:
            await self._send("sendFriendRequestResponse", {"message": "NotFoundFriendId"})
            return
        isExsits = await FriendRepository.send_friend_request(user, friend)
        if isExsits:
            await self._send("sendFriendRequestResponse", {"message": "AlreadySendFriendRequest"})
            return
        if friend.id in channel_name_map:
            channel_name = channel_name_map[friend.id]
            await notify_client_event(self.channel_layer, channel_name, "notify_friend_request_receive", 
                                      {"clientInfo": {"id": user.id,
                                       "nickname": user.nickname,
                                       "avatarUrl": user.get_image_uri()}}
                                       )
        await self._send("sendFriendRequestResponse", {"message": "OK"})
    
    async def cancel_friend_request(self, friend_id):
        from .repositories import FriendRepository
        from .repositories import UserRepository
        user = await UserRepository.get_user_by_id(self.client_id)
        friend = await UserRepository.get_user_by_id(friend_id)
        if friend is None:
            await self._send("cancelFriendRequestResponse", {"message": "NotFoundFriendId"})
            return
        isExsits = await FriendRepository.cancel_friend_request(user, friend)
        if not isExsits:
            await self._send("cancelFriendRequestResponse", {"message": "NotFoundFriendRequest"})
            return
        if friend.id in channel_name_map:
            channel_name = channel_name_map[friend.id]
            await notify_client_event(self.channel_layer, channel_name, "notify_friend_request_canceled", 
                                      {"clientInfo": {"id": user.id}})
        await self._send("cancelFriendRequestResponse", {"message": "OK"})
    
    async def accept_friend_request(self, friend_id):
        from .repositories import FriendRepository
        from .repositories import UserRepository
        user = await UserRepository.get_user_by_id(self.client_id)
        friend = await UserRepository.get_user_by_id(friend_id)
        if friend is None:
            await self._send("acceptFriendRequestResponse", {"message": "NotFoundFriendId"})
            return
        isExsits = await FriendRepository.accept_friend_request(user, friend)
        if not isExsits:
            await self._send("acceptFriendRequestResponse", {"message": "NotFoundFriendRequest"})
            return
        if friend.id in channel_name_map:
            channel_name = channel_name_map[friend.id]
            active_state = "ACTIVE"
            await notify_client_event(self.channel_layer, channel_name, "notify_friend_request_accepted", 
                                     {"clientInfo": {"id": user.id, "activeState": "ACTIVE"}})
        else:
            active_state = "INACTIVE"
        await self._send("acceptFriendRequestResponse", {"message": "OK",
            "clientInfo": {
                "activeState": active_state
            }                                             })
    
    async def notify_friend_request_canceled(self, event):
        Printer.log(f">>>>> AUTH sent >>>>>", "cyan")
        Printer.log(f"event : {event}", "cyan")
        content = event['content']
        await self.send(text_data=json.dumps({
            'event': 'notifyFriendRequestCanceled',
            'content': content
        }))
    
    async def notify_friend_request_accepted(self, event):
        Printer.log(f">>>>> AUTH sent >>>>>", "cyan")
        Printer.log(f"event : {event}", "cyan")
        content = event['content']
        # 클라이언트에 메시지 전송
        await self.send(text_data=json.dumps({
            'event': 'notifyFriendRequestAccepted',
            'content': content
        }))
    
    async def reject_friend_request(self, friend_id):
        from .repositories import FriendRepository
        from .repositories import UserRepository
        user = await UserRepository.get_user_by_id(self.client_id)
        friend = await UserRepository.get_user_by_id(friend_id)
        if friend is None:
            await self._send("rejectFriendRequestResponse", {"message": "NotFoundFriendId"})
            return
        isExsits = await FriendRepository.cancel_friend_request(friend, user)
        if not isExsits:
            await self._send("rejectFriendRequestResponse", {"message": "NotFoundFriendRequest"})
            return
        if friend.id in channel_name_map:
            channel_name = channel_name_map[friend.id]
            await notify_client_event(self.channel_layer, channel_name, "notify_friend_request_rejected", 
                                      {"clientInfo": {"id": user.id}})
        await self._send("rejectFriendRequestResponse", {"message": "OK"})
    
    async def notify_friend_request_rejected(self, event):
        Printer.log(f">>>>> AUTH sent >>>>>", "cyan")
        Printer.log(f"event : {event}", "cyan")
        content = event['content']
        # 클라이언트에 메시지 전송
        await self.send(text_data=json.dumps({
            'event': 'notifyFriendRequestRejected',
            'content': content
        }))
    
    async def delete_friend(self, friend_id):
        from .repositories import FriendRepository
        from. repositories import UserRepository
        user = await UserRepository.get_user_by_id(self.client_id)
        friend = await UserRepository.get_user_by_id(friend_id)
        if friend is None:
            await self._send("deleteFriendResponse", {"message": "NotFoundFriendId"})
            return
        isExsits = await FriendRepository.delete_friend(user, friend)
        if not isExsits:
            await self._send("deleteFriendResponse", {"message": "NotFoundFriend"})
            return
        await self._send("deleteFriendResponse", {"message": "OK"})
        if friend.id in channel_name_map:
            channel_name = channel_name_map[friend.id]
            await notify_client_event(self.channel_layer, channel_name, "notify_friend_deleted", 
                                      {"clientInfo": {"id": user.id}})

    async def notify_friend_deleted(self, event):
        Printer.log(f">>>>> AUTH sent >>>>>", "cyan")
        Printer.log(f"event : {event}", "cyan")
        content = event['content']
        await self.send(text_data=json.dumps({
            'event': 'notifyFriendDeleted',
            'content': content
        }))
    
    async def notify_friend_request_receive(self, event):
        Printer.log(f">>>>> AUTH sent >>>>>", "cyan")
        Printer.log(f"event : {event}", "cyan")
        content = event['content']
        # 클라이언트에 메시지 전송
        await self.send(text_data=json.dumps({
            'event': 'notifyFriendRequestReceive',
            'content': content
        }))

    async def get_client_list_blocked_by_user(self):
        from .repositories import UserRepository
        from .repositories import BlockedUserRepository
        user = await UserRepository.get_user_by_id(self.client_id)
        blocked_users = await BlockedUserRepository.get_blocked_users(user)
        await self._send("getClientListIBlockedResponse", {"message": "OK", "clientList": blocked_users})
    
    async def block_client(self, target_user_id):
        from .repositories import UserRepository
        from .repositories import BlockedUserRepository
        from .repositories import FriendRepository
        user = await UserRepository.get_user_by_id(self.client_id)
        target_user = await UserRepository.get_user_by_id(target_user_id)
        if target_user is None:
            await self._send("blockClientResponse", {"message": "NotFoundTargetUser"})
            return
        friendIndex = await FriendRepository.check_friend_relation(user, target_user)
        if friendIndex == "FRIEND":
            if target_user.id in channel_name_map:
                channel_name = channel_name_map[target_user.id]
                await notify_client_event(self.channel_layer, channel_name, "notify_friend_deleted", 
                                        {"clientInfo": {"id": user.id}})
        elif friendIndex == "FRIEND_REQUEST":
            if target_user.id in channel_name_map:
                channel_name = channel_name_map[target_user.id]
                await notify_client_event(self.channel_layer, channel_name, "notify_friend_request_canceled", 
                                        {"clientInfo": {"id": user.id}})
        isExsits = await BlockedUserRepository.block_user(user, target_user)
        if isExsits:
            await self._send("blockClientResponse", {"message": "AlreadyBlocked"})
            return
        await self._send("blockClientResponse", {"message": "OK"})
    
    async def unblock_client(self, target_user_id):
        from .repositories import UserRepository
        from .repositories import BlockedUserRepository
        user = await UserRepository.get_user_by_id(self.client_id)
        target_user = await UserRepository.get_user_by_id(target_user_id)
        if target_user is None:
            await self._send("unblockClientResponse", {"message": "NotFoundTargetUser"})
            return
        isValid = await BlockedUserRepository.unblock_user(user, target_user)
        if not isValid:
            await self._send("unblockClientResponse", {"message": "NotFoundBlockedUser"})
            return
        await self._send("unblockClientResponse", {"message": "OK"})
    async def search_client(self, keyword):
        from .repositories import UserRepository
        users = await UserRepository.search_user_by_nickname(keyword)
        await self._send("searchClientResponse", {"message": "OK", "clientList": users})
    
    async def send_message(self, receiver_id, message):
        from .repositories import UserRepository
        from .repositories import MessageRepository
        sender = await UserRepository.get_user_by_id(self.client_id)
        receiver = await UserRepository.get_user_by_id(receiver_id)
        if len(message) > 1000:
            await self._send("sendMessageResponse", {"message": "longMessageLength"})
            return
        if receiver is None:
            await self._send("sendMessageResponse", {"message": "NotFoundReceiver"})
            return
        message_object = await MessageRepository.save_message(sender, receiver, message)
        response = {"sendClientId": sender.id,
                "receiveClientId": receiver.id,
                "message": message,
                "timestamp": message_object.send_date.isoformat()}
        await notify_client_event(self.channel_layer, self.channel_name, "notify_message_received", response)
        if receiver.id in channel_name_map:
            channel_name = channel_name_map[receiver.id]
            await notify_client_event(self.channel_layer, channel_name, "notify_message_received", response)
        await self._send("sendMessageResponse", {"message": "OK"})

    async def notify_message_received(self, event):
        Printer.log(f">>>>> AUTH sent >>>>>", "cyan")
        Printer.log(f"event : {event}", "cyan")
        content = event['content']
        await self.send(text_data=json.dumps({
            'event': 'notifyMessageArrive',
            'content': content
        }))
    
    async def get_total_chat_data(self, receiver_id):
        from .repositories import UserRepository
        from .repositories import MessageRepository
        sender = await UserRepository.get_user_by_id(self.client_id)
        receiver = await UserRepository.get_user_by_id(receiver_id)
        if receiver is None:
            await self._send("getTotalChatDataResponse", {"message": "NotFoundReceiver"})
            return
        if self.read_receiver_id is not None and self.read_receiver_id == receiver_id:
            await self._send("getTotalChatDataResponse", {"message": "AlreadyReadingChatData"})
            return
        self.read_receiver_id = receiver_id
        messages = await MessageRepository.get_total_chat_data(sender, receiver)
        response = {
            "message": "OK",
            "messageList": messages
        }
        self.read_receiver_id = receiver_id
        await self._send("getTotalChatDataResponse", response)

    async def notify_all_group_activation(self, event, content):
        from .repositories import FriendRepository
        from .repositories import UserRepository
        user = await UserRepository.get_user_by_id(self.client_id)
        friends = await FriendRepository.get_friends(user, channel_name_map)
        for friend in friends:
            if friend['id'] not in channel_name_map:
                continue
            channel_name = channel_name_map[friend['id']]
            await notify_client_event(self.channel_layer, channel_name, event, content)
    
    async def notify_friend_active_state_change(self, event):
        Printer.log(f">>>>> AUTH sent >>>>>", "cyan")
        Printer.log(f"event : {event}", "cyan")
        content = event['content']
        await self.send(text_data=json.dumps({
            'event': 'notifyFriendActiveStateChange',
            'content': content
        }))
    
    async def stop_reading_chat(self, receiver_id):
        if self.read_receiver_id != receiver_id:
            await self._send("stopReadingChatResponse", {"message": "OK"})
            return
        self.read_receiver_id = None
        await self._send("stopReadingChatResponse", {"message": "OK"})
        
def make_word_by_game(round_info_list, my_team):
    total_rounds = len(round_info_list)
    my_wins = sum(1 for round_info in round_info_list.values() if round_info['win_team'] == my_team)
    opponent_wins = total_rounds - my_wins
    
    # 패들 타입 정보 확인
    paddle_hits_per_round = [sum(1 for hit in round_info['ball_hits'] if hit['type'] == 'PADDLE') 
                             for round_info in round_info_list.values()]
    
    # 역전 여부 확인
    was_losing = False
    was_winning = False
    comeback_win = False
    comeback_lose = False
    
    for round_num, round_info in round_info_list.items():
        if round_info['win_team'] == my_team:
            if was_losing:
                comeback_win = True
                break
            was_winning = True
        else:
            if was_winning:
                comeback_lose = True
                break
            was_losing = True

    # 결과 결정
    if comeback_lose:
        return "아쉬운 역전패"
    elif comeback_win:
        return "짜릿한 역전승"
    elif my_wins > opponent_wins and opponent_wins == 0:
        return "살살하셔야 겠어요~"
    elif my_wins == 0:
        return "그 실력에 잠이 오냐?"
    elif any(hits >= 10 for hits in paddle_hits_per_round):
        return "치혈했던 혈전"
    elif my_wins > opponent_wins:
        return "승리"
    else:
        return "패배"