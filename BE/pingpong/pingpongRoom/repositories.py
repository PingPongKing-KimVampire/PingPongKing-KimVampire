from lobby.models import User, Team, TeamUser, Game, Round, BallHit
from lobby.models import User, Team, TeamUser, Game, Round, BallHit
from asgiref.sync import sync_to_async
from django.db.models import Prefetch

abilities = {"jiantBlocker", "ghostSmasher", "speedTwister", "illusionFaker", "none"}
modes = {"HUMAN_HUMAN", "VAMPIRE_VAMPIRE", "VAMPIRE_HUMAN"}
team_kinds = {"HUMAN", "VAMPIRE"}
ball_kinds = {"PADDLE", "SCORE"}

abilities = {"jiantBlocker", "ghostSmasher", "speedTwister", "illusionFaker", "none"}
modes = {"HUMAN_HUMAN", "VAMPIRE_VAMPIRE", "VAMPIRE_HUMAN"}
team_kinds = {"HUMAN", "VAMPIRE"}
ball_kinds = {"PADDLE", "SCORE"}

class GameRepository:
	# 게임 끝나고 사용할 함수
	@staticmethod
	@sync_to_async
	def save_game_async(meta_info):
		mode = meta_info["mode"]
		start_time = meta_info["start_time"]
		end_time = meta_info["end_time"]
		our_user_id_list = meta_info["team1_users"]
		opponent_user_id_list = meta_info["team2_users"]
		our_team_kind = meta_info["team1_kind"]
		opponent_team_kind = meta_info["team2_kind"]
		if meta_info["team1_ability"] is not None:
			our_team_ability = meta_info["team1_ability"]
		else:
			our_team_ability = "none"
		if meta_info["team2_ability"] is not None:
			opponent_team_ability = meta_info["team2_ability"]
		else:
			opponent_team_ability = "none"
		our_team_score = meta_info["team1_score"]
		opponent_team_score = meta_info["team2_score"]
		round_info_dict = meta_info["round"]
		return GameRepository.save_game(mode, our_team_ability, opponent_team_ability, 
			   our_user_id_list, opponent_user_id_list, 
			   our_team_kind, opponent_team_kind,
			   our_team_score,
			   opponent_team_score,
			   start_time,
			   end_time, 
			   round_info_dict)
	@staticmethod
	def get_games_by_user_id(user_id):
		user = User.objects.get(id=user_id)
		if user is None:
			return None
		team_user = TeamUser.objects.get(user=user)
		team = team_user.team
		games = Game.objects.filter(teams=team)
		return games

	@staticmethod
	def save_game(mode, our_team_ability, opponent_team_ability, 
			   our_user_id_list, opponent_user_id_list, 
			   our_team_kind, opponent_team_kind,
			   our_team_score,
			   opponent_team_score,
			   start_time,
			   end_time, 
			   round_info_dict):
		# if mode not in modes or our_team_ability not in abilities or \
		# 	opponent_team_ability not in abilities or our_team_kind not in team_kinds \
		# 	or opponent_team_kind not in team_kinds:
		# 	return None
		game = Game.objects.create(mode=mode, start_at=start_time, end_at=end_time)
		our_team = TeamRepository.create_team(our_user_id_list, game, our_team_kind, our_team_ability, our_team_score)
		opponent_team = TeamRepository.create_team(opponent_user_id_list, game, opponent_team_kind, opponent_team_ability, opponent_team_score)
		for round_number in round_info_dict:
			round_info = round_info_dict[round_number]
			if round_info["win_team"] == "team1":
				target_team = our_team
			else:
				target_team = opponent_team
			round = GameRepository.save_round(game.id, round_number, target_team)
			ball_hits = round_info["ball_hits"]
			for ball_hit in ball_hits:
				GameRepository.save_hit(round, ball_hit["type"], ball_hit["y"], ball_hit["x"])
		return game
	
	@staticmethod
	def save_round(game_id, order, team):
		game = Game.objects.get(id=game_id)
		if game is None:
			return None
		round = Round.objects.create(game=game, order=order, win_team=team)
		return round
		
	@staticmethod
	def save_hit(round, type, y_coordinate, x_coordinate):
		BallHit.objects.create(round=round, kind=type, y_coordinate=y_coordinate, x_coordinate=x_coordinate)

class TeamRepository:
	@staticmethod
	def create_team(user_id_list, game, kind, effect, score):
		team = Team.objects.create(game=game, kind=kind, effect=effect, score=score)
		for user_id in user_id_list:
			user = User.objects.get(id=user_id)
			TeamUser.objects.create(team=team, user=user)
		return team
	
class GameReadRepository:

	@staticmethod
	@sync_to_async
	def get_game_history_by_user_id_async(user_id):
		user = User.objects.get(id=user_id)
		if user is None:
			return {
				"error": "User not found"
			}
		return GameReadRepository.get_game_history_by_user_id()

	@staticmethod
	def get_game_history_by_user_id(user):
		if user is None:
			return None
		teams = []
		game_prefetch = Prefetch('team__game', queryset=Game.objects.all())
		team_users = TeamUser.objects.select_related('team__game').prefetch_related(game_prefetch).filter(user=user).all()
		game_history = []
		for team_user in team_users:
			target_game = team_user.team.game
			my_team_list = []
			opponent_team_list = []
			all_teams = Team.objects.filter(game=target_game).all()
			for target_team in all_teams:
				team_users = TeamUser.objects.select_related('user').filter(team=target_team).all()
				if target_team.id is team_user.team.id:
					my_team_score = target_team.score
					my_team_effect = target_team.effect
					for team_user in team_users:
						my_team_list.append({
							"clientId": team_user.user.id,
							"nickname": team_user.user.nickname,
							"imageUri": team_user.user.get_image_uri()
						})
				else:
					opponent_team_score = target_team.score
					opponent_team_effect = target_team.effect
					for team_user in team_users:
						opponent_team_list.append({
							"clientId": team_user.user.id,
							"nickname": team_user.user.nickname,
							"imageUri": team_user.user.get_image_uri()
						})
			game_history.append({
				"gameId": target_game.id,
				"score": [my_team_score, opponent_team_score],
				"mode": target_game.mode,
				"ability": [my_team_effect, opponent_team_effect],
				"myTeamClientInfoList": my_team_list,
				"opponentTeamClientInfoList": opponent_team_list
			})
		data = {
			"nickname": user.nickname,
			"imageUri": user.get_image_uri(),
			"gameHistoryList": game_history
		}
		return data
	
	@staticmethod
	def get_games_by_user(user):
		game_prefetch = Prefetch('team__game', queryset=Game.objects.all())
		team_prefetch = Prefetch('team_user__team', queryset=Team.objects.all())
		
		team_users = TeamUser.objects.select_related('team__game').prefetch_related(game_prefetch).filter(user=user).all()
	
	# @staticmethod
	# def get_games_with_user_teams(user):
	# 	if user is None:
	# 		return None

	# 	# Fetch all TeamUser instances related to the user
	# 	user_teams = TeamUser.objects.filter(user=user).select_related('team__game')

	# 	# Create a dictionary to hold game-related data
	# 	games_dict = {}

	# 	# Initialize games_dict with game information and placeholders for team information
	# 	for team_user in user_teams:
	# 		game = team_user.team.game
	# 		if game.id not in games_dict:
	# 			games_dict[game.id] = {
	# 				'game': game,
	# 				'my_team': None,
	# 				'my_team_users': [],
	# 				'opponent_teams': [],
	# 				'opponent_teams_users': []
	# 			}

	# 	# Populate games_dict with user's team and users
	# 	for team_user in user_teams:
	# 		game = team_user.team.game
	# 		game_data = games_dict[game.id]
	# 		game_data['my_team'] = team_user.team
	# 		game_data['my_team_users'] = list(TeamUser.objects.filter(team=team_user.team).select_related('user'))

	# 	# Fetch other teams and their users for each game
	# 	for game_id, game_data in games_dict.items():
	# 		other_teams = Team.objects.filter(game=game_data['game']).exclude(id=game_data['my_team'].id).prefetch_related(
	# 			Prefetch('team_users', queryset=TeamUser.objects.select_related('user'))
	# 		)
	# 		game_data['opponent_teams'] = list(other_teams)
	# 		for team in other_teams:
	# 			opponent_team_users = list(team.team_users.all())
	# 			game_data['opponent_teams_users'].extend(opponent_team_users)
	# 	print(games_dict.values())
	# 	return games_dict.values()