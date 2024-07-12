from lobby.models import User, Team, TeamUser, Game, Round
from asgiref.sync import sync_to_async

class GameRepository:
	@staticmethod
	@sync_to_async
	def create_game(mode, effect, our_user_id_list, opponent_user_id_list):
		game = Game.objects.create()
		our_team = TeamRepository.create_team(our_user_id_list, game)
		opponent_team = TeamRepository.create_team(opponent_user_id_list, game)
		return game # 우리 팀 상대 팀도 id 반환해야 하는지 확인
	
	@staticmethod
	@sync_to_async
	def end_game(game_id):
		game = Game.objects.get(id=game_id)
		if game is None:
			return
		game.finish()
		game.save()
		return 

class TeamRepository:
	@staticmethod
	def create_team(user_id_list, game):
		team = Team.objects.create(game=game)
		for user_id in user_id_list:
			user = User.objects.get(id=user_id)
			TeamUser.objects.create(team=team, user=user)
		return team
	
