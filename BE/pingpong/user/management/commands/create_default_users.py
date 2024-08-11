from django.core.management.base import BaseCommand
from lobby.models import User

class Command(BaseCommand):
    help = 'Creates default users'

    def handle(self, *args, **kwargs):
        default_users = [
            {'username': '1', 'password': 'qweasdzxc1!', 'nickname': '민지'},
            {'username': '2', 'password': 'qweasdzxc1!', 'nickname': '해린'},
            # 필요한 만큼 사용자를 추가하세요
        ]

        for user_data in default_users:
            if not User.objects.filter(username=user_data['username']).exists():
                user = User.objects.create(
                    username=user_data['username'],
                    nickname=user_data['nickname']
                )
                user.set_password(user_data['password'])
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Successfully created user: {user.username}'))
            else:
                self.stdout.write(self.style.WARNING(f'User already exists: {user_data["username"]}'))