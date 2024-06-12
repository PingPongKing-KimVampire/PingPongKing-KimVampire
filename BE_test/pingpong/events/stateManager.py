import uuid

class StateManager:
    def __init__(self):
        self.clients = {}
        self.rooms = {}

    def add_client(self, client):
        client_id = str(uuid.uuid4())
        self.clients[client_id] = client
        return client_id

    def remove_client(self, client_id):
        if client_id in self.clients:
            del self.clients[client_id]

    def create_room(self, client):
        room_id = str(uuid.uuid4())
        self.rooms[room_id] = {
            'referee': client,
            'players': []
        }
        return room_id

    def add_player_to_room(self, room_id, player):
        if room_id in self.rooms:
            self.rooms[room_id]['players'].append(player)

    def get_room_list(self):
        return list(self.rooms.keys())

    def get_room(self, room_id):
        return self.rooms.get(room_id, None)