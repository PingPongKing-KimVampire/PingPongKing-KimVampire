from lobby.models import User, Team, TeamUser, Game, Round, BallHit
from lobby.models import User, Team, TeamUser, Game, Round, BallHit
from asgiref.sync import sync_to_async

abilities = {"jiantBlocker", "ghostSmasher", "speedTwister", "illusionFaker", "none"}
modes = {"HUMAN_HUMAN", "VAMPIRE_VAMPIRE", "VAMPIRE_HUMAN"}
team_kinds = {"HUMAN", "VAMPIRE"}
ball_kinds = {"PADDLE", "SCORE"}

class GameRepository:
	# 게임 끝나고 사용할 함수
	@staticmethod
	@sync_to_async
	def save_game_async(meta_info):
		print(meta_info)
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
		print("our team", our_team.id)
		opponent_team = TeamRepository.create_team(opponent_user_id_list, game, opponent_team_kind, opponent_team_ability, opponent_team_score)
		print("opponent team", opponent_team.id)
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
