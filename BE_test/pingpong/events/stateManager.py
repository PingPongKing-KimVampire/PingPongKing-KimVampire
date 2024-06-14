import uuid

class StateManager:
    def __init__(self):
        self.clients = {}
        self.rooms = {}

    def addClient(self, client):
        clientId = str(uuid.uuid4())
        self.clients[clientId] = client
        return clientId

    def removeClient(self, clientId):
        if clientId in self.clients:
            del self.clients[clientId]

    def createRoom(self, client, gameInfo):
        roomId = str(uuid.uuid4())
        self.rooms[roomId] = {
            'referee': client,
            'players': [],
            'gameInfo': gameInfo,
            'state': 'WAITING'
        }
        return roomId

    def addPlayerToRoom(self, roomId, player):
        if roomId in self.rooms:
            self.rooms[roomId]['players'].append(player)

    def getRoomList(self):
        return list(self.rooms.keys())

    def getRoom(self, roomId):
        return self.rooms.get(roomId, None)
