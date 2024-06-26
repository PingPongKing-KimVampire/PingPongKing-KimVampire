from lobby.models import User

class UserRepository:
    def authenticate(username, password):
        user = User.objects.filter(username=username).first()
        if user.check_password(password):
            return user
        return None

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
    def delete_user(user):
        user.delete()
    