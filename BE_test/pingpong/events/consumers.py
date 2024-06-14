from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .stateManager import StateManager
from utils.printer import Printer

stateManager = StateManager()

class PingpongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.clientId = stateManager.addClient(self)
        self.isInit = False
        await self.accept()
        Printer.log(f"Client {self.clientId} connected", "green")

    async def disconnect(self, close_code):
        stateManager.removeClient(self.clientId)
        Printer.log(f"Client {self.clientId} disconnected", "red")

    async def receive(self, text_data):
        message = json.loads(text_data)
        Printer.log(f"Received message: {message}", "green")
        sender = message.get('sender')
        receiver = message.get('receiver')
        event = message.get('event')
        content = message.get('content')

        if not self.isInit and event != 'initClient':
            await self.sendNotInitMsg()
            return

        if 'server' in receiver:
            if event == 'initClient':
                await self.initClient(content['clientId'], content['clientNickname'])
            elif event == 'createWaitingRoom':
                await self.createWaitingRoom(content['gameInfo'])
            elif event == 'getWaitingRoomList':
                await self.getWaitingRoomList()
            elif event == 'enterWaitingRoomResponse':
                await self.enterWaitingRoomResponse(message)
            elif event == 'startGame':
                await self.startGame(content['roomId'])
        if 'player' in receiver:
            roomId = content.get('roomId')
            if not roomId or not stateManager.getRoom(roomId):
                await self.sendNoRoomMsg(message)
                return
            playerList = stateManager.getRoom(roomId)['players']
            for player in playerList:
                await player.send(json.dumps(message))
        if 'referee' in receiver:
            roomId = content.get('roomId')
            if not roomId or not stateManager.getRoom(roomId):
                await self.sendNoRoomMsg(message)
                return
            referee = stateManager.getRoom(roomId)['referee']
            await referee.send(json.dumps(message))
        if 'waitingRoom' in receiver:
            Printer.log(f"Message received for waiting room: {message}", "blue")
            await self.sendMsgToHostClient(message, 'waitingRoom')
        if 'pingpongBoard' in receiver:
            Printer.log(f"Message received for pingpong board: {message}", "blue")
            await self.sendMsgToHostClient(message, 'pingpongBoard')

    async def initClient(self, clientId, clientNickname):
        self.clientId = clientId
        self.nickname = clientNickname
        self.isInit = True
        stateManager.clients[self.clientId] = self  # Ensure the client is added to the state manager
        await self.send(json.dumps({
            'sender': 'server',
            'receiver': ['unauthenticatedClient'],
            'event': 'registerClientSuccess'
        }))
        Printer.log(f"Client {self.clientId} initialized with nickname {self.nickname}", "cyan")

    async def sendNotInitMsg(self):
        await self.send(json.dumps({
            'sender': 'server',
            'receiver': ['client'],
            'event': 'notInit'
        }))
        Printer.log(f"Client {self.clientId} is not initialized", "yellow")

    async def createWaitingRoom(self, gameInfo):
        roomId = stateManager.createRoom(self, gameInfo)
        await self.send(json.dumps({
            'sender': 'server',
            'receiver': ['client'],
            'event': 'appointWaitingRoom',
            'content': {'roomId': roomId, 'gameInfo': gameInfo}
        }))
        Printer.log(f"Waiting room {roomId} created", "blue")

    async def getWaitingRoomList(self):
        roomList = stateManager.getRoomList()
        await self.send(json.dumps({
            'sender': 'server',
            'receiver': ['client'],
            'event': 'getWaitingRoomResponse',
            'content': {'roomIdList': roomList}
        }))
        Printer.log(f"Waiting room list sent to client {self.clientId}", "blue")

    async def enterWaitingRoomResponse(self, message):
        print(message)
        content = message['content']
        roomId = content['roomId']
        clientId = content['clientId']
        Printer.log(f"roomId: {roomId}, clientId: {clientId}", "blue")

        room = stateManager.getRoom(roomId)
        if not room:
            await self.sendNoRoomMsg(message)
            Printer.log("Room not found", "yellow")
            return
        
        player = stateManager.clients.get(clientId)
        if not player:
            Printer.log(f"Client ID {clientId} not found", "red")
            await self.sendNoRoomMsg(message)
            return

        stateManager.addPlayerToRoom(roomId, player)
        
        room['state'] = 'WAITING'
        
        Printer.log(f"Client {clientId} entered waiting room {roomId}", "blue")
        await player.send(json.dumps({
            'sender': 'server',
            'receiver': ['client'],
            'event': 'enterWaitingRoomResponse',
            'content': {
                'roomId': roomId,
                'gameInfo': room['gameInfo']
            }
        }))

    async def startGame(self, roomId):
        room = stateManager.getRoom(roomId)
        if not room:
            await self.sendNoRoomMsg({"roomId": roomId})
            return
        room['state'] = 'PLAYING'
        await self.send(json.dumps({
            'sender': 'server',
            'receiver': ['client'],
            'event': 'startGameSuccess',
            'content': {'roomId': roomId}
        }))
        Printer.log(f"Game started in waiting room {roomId}", "blue")

    async def sendNoRoomMsg(self, message):
        await self.send(json.dumps({
            'sender': 'server',
            'receiver': ['client'],
            'event': 'noRoom',
            'content': {'clientMsg': message}
        }))
        Printer.log("Room not found", "yellow")
        
    async def sendMsgToHostClient(self, message, receiver):
        Printer.log(f"sendMsgToHostClient called with receiver: {receiver}", "cyan")
        roomId = message['content']['roomId']
        room = stateManager.getRoom(roomId)
        if not room:
            await self.sendNoRoomMsg(message)
            Printer.log(f"Room {roomId} not found in sendMsgToHostClient", "yellow")
            return
        hostClient = room['referee']
        Printer.log(f"Message sent to host client in room {roomId}", "blue")
        print(f"hostClient: {hostClient}")
        await hostClient.send(json.dumps(message))
