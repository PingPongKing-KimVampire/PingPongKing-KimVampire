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
		win_team = meta_info["win_team"]
		return GameRepository.save_game(mode, our_team_ability, opponent_team_ability, 
			   our_user_id_list, opponent_user_id_list, 
			   our_team_kind, opponent_team_kind,
			   our_team_score,
			   opponent_team_score,
			   start_time,
			   end_time, 
			   round_info_dict,
			   win_team)
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
			   round_info_dict,
			   win_team):
		game = Game.objects.create(mode=mode, start_at=start_time, end_at=end_time,  total_round=len(round_info_dict))
		if win_team == "left":
			is_win = True
		else:
			is_win = False
		our_team = TeamRepository.create_team(our_user_id_list, game, our_team_kind, our_team_ability, our_team_score, is_win)
		opponent_team = TeamRepository.create_team(opponent_user_id_list, game, opponent_team_kind, opponent_team_ability, opponent_team_score, not is_win)
		for round_number in round_info_dict:
			round_info = round_info_dict[round_number]
			if round_info["win_team"] == "left":
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
	def create_team(user_id_list, game, kind, effect, score, is_win):
		team = Team.objects.create(game=game, kind=kind, effect=effect, score=score, is_win=is_win)
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
		return GameReadRepository.get_game_history_by_user_id(user)
	
	@staticmethod
	@sync_to_async
	def get_game_detail_by_user_id_and_game_id_async(self, user_id, game_id):
		user = User.objects.get(id=user_id)
		if user is None:
			return {
				"error": "User not found"
			}
		game = Game.objects.get(id=game_id)
		if game is None:
			return {
				"error": "Game not found"
			}
		return GameReadRepository.get_game_detail_by_user_id_and_game_id(user, game)
	
	@staticmethod
	def get_game_detail_by_user_id_and_game_id(user, game):
		teams = Team.objects.filter(game=game).select_related('game').all()
		team_users = TeamUser.objects.select_related('user', 'team').filter(team__in=teams).all()
		rounds = Round.objects.filter(game=game).select_related('game', 'win_team').all()
		ballhits = BallHit.objects.select_related('round').filter(round__in=rounds).all()
		my_team_users = []
		opponent_team_users = []
		for team_user in team_users:
			if team_user.user.id == user.id:
				my_team = team_user.team
				break
		for team in teams:
			if team.id != my_team.id:
				opponent_team = team
				break
		for team_user in team_users:
			if team_user.team.id == my_team.id:
				my_team_users.append({
					"clientId": team_user.user.id,
					"nickname": team_user.user.nickname,
					"avatarUrl": team_user.user.get_image_uri()
				})
			else:
				opponent_team_users.append({
					"clientId": team_user.user.id,
					"nickname": team_user.user.nickname,
					"avatarUrl": team_user.user.get_image_uri()
				})
		score_list = [None] * game.total_round
		hit_map_list = {}
		for round in rounds:
			score_list[round.order] = round.is_win(my_team)
			ball_hit_list = []
			for ballhit in ballhits:
				if ballhit.round.id != round.id:
					continue
				ball_hit_list.append({
					"type": ballhit.kind,
					"y": ballhit.y_coordinate,
					"x": ballhit.x_coordinate
				})
			hit_map_list[round.order] = ball_hit_list 
		data = {
			"score": [my_team.score, opponent_team.score],
			"mode": game.mode,
			"result": my_team.is_win_to_string(),
			"teamKind": [my_team.kind, opponent_team.kind],
			"ability": [my_team.effect, opponent_team.effect],
			"myTeamClientInfoList": my_team_users,
			"opponentTeamClientInfoList": opponent_team_users,
			"word": GameReadRepository.make_vampire_word(rounds, my_team, opponent_team, game, hit_map_list),
			"scoreList": score_list,
			"hitMapList": hit_map_list
		}
		return data
		

	@staticmethod
	def get_game_history_by_user_id(user):
		if user is None:
			return None
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
					win_state = target_team.is_win_to_string()
					my_team = target_team
					my_team_score = target_team.score
					my_team_effect = target_team.effect
					for team_user in team_users:
						my_team_list.append({
							"clientId": team_user.user.id,
							"nickname": team_user.user.nickname,
							"avatarUrl": team_user.user.get_image_uri()
						})
				else:
					opponent_team_score = target_team.score
					opponent_team_effect = target_team.effect
					opponent_team = target_team
					for team_user in team_users:
						opponent_team_list.append({
							"clientId": team_user.user.id,
							"nickname": team_user.user.nickname,
							"avatarUrl": team_user.user.get_image_uri()
						})
			game_history.append({
				"gameId": target_game.id,
				"timestamp": target_game.start_at.isoformat(),
				"score": [my_team_score, opponent_team_score],
				"teamKind": [my_team.kind, opponent_team.kind],
				"result": my_team.is_win_to_string(),
				"mode": target_game.mode,
				"ability": [my_team_effect, opponent_team_effect],
				"myTeamClientInfoList": my_team_list,
				"opponentTeamClientInfoList": opponent_team_list
			})
		data = {
			"nickname": user.nickname,
			"avatarUrl": user.get_image_uri(),
			"gameHistoryList": game_history
		}
		return data
	
	@staticmethod
	def make_vampire_word(rounds, our_team, opponent_team, game, hit_map_list):
		total_round = game.total_round
		was_losing = False
		was_winning = False
		comeback_win = False
		comeback_lose = False
		paddle_hits_per_round = [sum(1 for hit in hits if hit["type"] == "PADDLE") for hits in hit_map_list.values()]

		for round in rounds:
			if round.win_team.id == our_team.id:
				if was_losing:
					comeback_win = True
					break
				was_winning = True
			else:
				if was_winning:
					comeback_lose = True
					break
				was_losing = True
		if comeback_lose:
			return "아쉬운 역전패"
		elif comeback_win:
			return "짜릿한 역전승"
		elif opponent_team.score == 0:
			return "살살하셔야 겠어요~"
		elif our_team.score  == 0:
			return "그 실력에 잠이 오냐?"
		elif any(hits >= 10 for hits in paddle_hits_per_round):
			return "치혈했던 혈전"
		elif our_team.score > opponent_team.score and our_team.is_win:
			return "승리"
		else:
			return "패배"	