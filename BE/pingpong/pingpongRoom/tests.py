import pytest
import datetime
from django.test import TestCase
from lobby.models import User, Game, Team, TeamUser, Round, BallHit
from .repositories import GameRepository, TeamRepository, GameReadRepository
from django.utils import timezone
import random

class TestGameRepository(TestCase):
    @pytest.mark.django_db(transaction=True)
    def test_get_game_detail(self):
        # Create target and enemy users
        target_user = User.objects.create(username='test_user', password='password', nickname='Test User', image_uri='test_uri')
        enemy_user = User.objects.create(username='enemy_user', password='password', nickname='Enemy User', image_uri='enemy_uri')

        # Create a game
        game = Game.objects.create(mode="HUMAN_HUMAN", start_at=timezone.now(), end_at=timezone.now(), total_round=3)

        # Create teams
        my_team = Team.objects.create(game=game, kind="kind1", effect="effect1", score=3)
        opponent_team = Team.objects.create(game=game, kind="kind2", effect="effect2", score=2)

        # Create team users
        TeamUser.objects.create(team=my_team, user=target_user)
        TeamUser.objects.create(team=opponent_team, user=enemy_user)

        # Create rounds and ball hits
        for round_order in range(game.total_round):
            round = Round.objects.create(game=game, order=round_order, win_team=my_team)
            BallHit.objects.create(round=round, kind="PADDLE", y_coordinate=10, x_coordinate=20)
            BallHit.objects.create(round=round, kind="PADDLE", y_coordinate=15, x_coordinate=25)
            BallHit.objects.create(round=round, kind="PADDLE", y_coordinate=10, x_coordinate=20)
            BallHit.objects.create(round=round, kind="PADDLE", y_coordinate=15, x_coordinate=25)
            BallHit.objects.create(round=round, kind="PADDLE", y_coordinate=10, x_coordinate=20)
            BallHit.objects.create(round=round, kind="PADDLE", y_coordinate=15, x_coordinate=25)
            BallHit.objects.create(round=round, kind="PADDLE", y_coordinate=10, x_coordinate=20)
            BallHit.objects.create(round=round, kind="PADDLE", y_coordinate=15, x_coordinate=25)
            BallHit.objects.create(round=round, kind="PADDLE", y_coordinate=10, x_coordinate=20)
            BallHit.objects.create(round=round, kind="PADDLE", y_coordinate=15, x_coordinate=25)
            BallHit.objects.create(round=round, kind="PADDLE", y_coordinate=10, x_coordinate=20)
            BallHit.objects.create(round=round, kind="PADDLE", y_coordinate=15, x_coordinate=25)
            BallHit.objects.create(round=round, kind="PADDLE", y_coordinate=10, x_coordinate=20)
            BallHit.objects.create(round=round, kind="PADDLE", y_coordinate=15, x_coordinate=25)

        # Call the function to get game details
        game_details = GameReadRepository.get_game_detail_by_user_id_and_game_id(target_user, game)

        # Validate the response
        assert game_details['score'] == [my_team.score, opponent_team.score]
        assert game_details['mode'] == game.mode
        assert game_details['ability'] == [my_team.effect, opponent_team.effect]
        assert game_details['myTeamClientInfoList'][0]['clientId'] == target_user.id
        assert game_details['myTeamClientInfoList'][0]['nickname'] == target_user.nickname
        assert game_details['myTeamClientInfoList'][0]['avatarUrl'] == target_user.image_uri
        assert game_details['opponentTeamClientInfoList'][0]['clientId'] == enemy_user.id
        assert game_details['opponentTeamClientInfoList'][0]['nickname'] == enemy_user.nickname
        assert game_details['opponentTeamClientInfoList'][0]['avatarUrl'] == enemy_user.image_uri
        assert game_details['word'] == "치혈했던 혈전"
        assert len(game_details['scoreList']) == game.total_round
        assert all(game_details['scoreList'])
        for round_order in range(game.total_round):
            ball_hit_list = game_details['hitMapList'][round_order]
            assert len(ball_hit_list) == 14
            assert ball_hit_list[0]['type'] == "PADDLE"
            assert ball_hit_list[0]['y'] == 10
            assert ball_hit_list[0]['x'] == 20
            assert ball_hit_list[1]['type'] == "PADDLE"
            assert ball_hit_list[1]['y'] == 15
            assert ball_hit_list[1]['x'] == 25

    @pytest.mark.django_db(transaction=True)
    def test_get_game_history_by_user_id(self):
        # Create target and enemy users
        target_user = User.objects.create(username='test_user', password='password', nickname='Test User', image_uri='test_uri')
        enemy_user = User.objects.create(username='enemy_user', password='password', nickname='Enemy User', image_uri='enemy_uri')

        expected_games = []
        for i in range(4):
            game = Game.objects.create(mode="HUMAN_HUMAN", start_at=timezone.now(), end_at=timezone.now())
            team1 = Team.objects.create(game=game, kind="kind1", effect="effect1", score=1)
            team2 = Team.objects.create(game=game, kind="kind2", effect="effect2", score=2)
            expected_games.append((team1, team2))
            TeamUser.objects.create(team=team1, user=target_user)
            TeamUser.objects.create(team=team2, user=enemy_user)

        # Call the function to get game history
        game_history = GameReadRepository.get_game_history_by_user_id(target_user)

        # Validate the response
        assert game_history['nickname'] == target_user.nickname
        assert game_history['avatarUrl'] == target_user.image_uri
        assert len(game_history['gameHistoryList']) == len(expected_games)

        for i, (team1, team2) in enumerate(expected_games):
            game_info = game_history['gameHistoryList'][i]
            assert game_info['gameId'] == team1.game.id
            assert game_info['score'] == [team1.score, team2.score]
            assert game_info['mode'] == team1.game.mode
            assert game_info['ability'] == [team1.effect, team2.effect]

            my_team_clients = game_info['myTeamClientInfoList']
            opponent_team_clients = game_info['opponentTeamClientInfoList']

            assert len(my_team_clients) == 1
            assert my_team_clients[0]['clientId'] == target_user.id
            assert my_team_clients[0]['nickname'] == target_user.nickname
            assert my_team_clients[0]['avatarUrl'] == target_user.image_uri

            assert len(opponent_team_clients) == 1
            assert opponent_team_clients[0]['clientId'] == enemy_user.id
            assert opponent_team_clients[0]['nickname'] == enemy_user.nickname
            assert opponent_team_clients[0]['avatarUrl'] == enemy_user.image_uri

#     # @pytest.mark.django_db(transaction=True)
#     # def test_get_games_by_user_id(self):
#     #     target_user = User.objects.create(username='test_user', password='password', image_uri = 'test_uri')
#     #     user_ids_team1 = [User.objects.create(username=f'user_team1_{i}', password='password').id for i in range(4)]
#     #     user_ids_team2 = [User.objects.create(username=f'user_team2_{i}', password='password').id for i in range(4)]
#     #     user_ids_team3 = [User.objects.create(username=f'user_team3_{i}', password='password').id for i in range(4)]
#     #     user_ids_team4 = [User.objects.create(username=f'user_team4_{i}', password='password').id for i in range(4)]
#     #     user_ids_team1.append(target_user.id)
#     #     user_ids_team3.append(target_user.id)
#     #     mode = 'HUMAN_HUMAN'
#     #     our_team_ability = 'none'
#     #     opponent_team_ability = 'none'
#     #     our_team_kind = 'HUMAN'
#     #     opponent_team_kind = 'HUMAN'
#     #     our_team_score = 10
#     #     opponent_team_score = 8
#     #     start_time = datetime.datetime.now()
#     #     end_time = datetime.datetime.now()
#         # round_info_dict = self.get_random_round_info(3)
        
#         # game1 = GameRepository.save_game(mode, our_team_ability, opponent_team_ability, 
#         #                         user_ids_team1, user_ids_team2, 
#         #                         our_team_kind, opponent_team_kind, 
#         #                         our_team_score, opponent_team_score, 
#         #                         start_time, end_time, round_info_dict)
#         # game2 = GameRepository.save_game(mode, our_team_ability, opponent_team_ability, 
#         #                 user_ids_team2, user_ids_team3, 
#         #                 our_team_kind, opponent_team_kind, 
#         #                 our_team_score, opponent_team_score, 
#         #                 start_time, end_time, round_info_dict)
#         # game3 = GameRepository.save_game(mode, our_team_ability, opponent_team_ability, 
#         #                 user_ids_team3, user_ids_team4, 
#         #                 our_team_kind, opponent_team_kind, 
#         #                 our_team_score, opponent_team_score, 
#         #                 start_time, end_time, round_info_dict)
#         # game 1, game 2만 나와야됨
        
        
        


        
#     # @pytest.mark.django_db(transaction=True)
#     # def test_save_game(self):
#     #     # 테스트 데이터 생성
#     #     user_ids_team1 = [User.objects.create(username=f'user_team1_{i}', password='password').id for i in range(4)]
#     #     user_ids_team2 = [User.objects.create(username=f'user_team2_{i}', password='password').id for i in range(4)]

#     #     mode = 'HUMAN_HUMAN'
#     #     our_team_ability = 'none'
#     #     opponent_team_ability = 'none'
#     #     our_team_kind = 'HUMAN'
#     #     opponent_team_kind = 'HUMAN'
#     #     our_team_score = 10
#     #     opponent_team_score = 8
#     #     start_time = datetime.datetime.now()
#     #     end_time = datetime.datetime.now()

#     #     round_info_dict = {
#     #         1: {
#     #             "win_team": "team1",
#     #             "ball_hits": [
#     #                 {"type": "hit", "y": 10.0, "x": 20.0},
#     #                 {"type": "miss", "y": 15.0, "x": 25.0},
#     #             ]
#     #         },
#     #         2: {
#     #             "win_team": "team2",
#     #             "ball_hits": [
#     #                 {"type": "hit", "y": 12.0, "x": 22.0},
#     #                 {"type": "miss", "y": 17.0, "x": 27.0},
#     #             ]
#     #         }
#     #     }
#     #     round_info_dict_sample = {
#     #         1: {
#     #             "win_team": "teamA",
#     #             "ball_hits": [
#     #                 {"type": "hit", "y": 5.0, "x": 15.0},
#     #                 {"type": "miss", "y": 10.0, "x": 20.0},
#     #             ]
#     #         },
#     #         2: {
#     #             "win_team": "teamB",
#     #             "ball_hits": [
#     #                 {"type": "hit", "y": 7.0, "x": 17.0},
#     #                 {"type": "miss", "y": 12.0, "x": 22.0},
#     #             ]
#     #         },
#     #         3: {
#     #             "win_team": "teamA",
#     #             "ball_hits": [
#     #                 {"type": "hit", "y": 6.0, "x": 16.0},
#     #                 {"type": "miss", "y": 11.0, "x": 21.0},
#     #             ]
#     #         }
#     #     }

#     #     # 게임 저장
#     #     game = GameRepository.save_game(mode, our_team_ability, opponent_team_ability, 
#     #                                     user_ids_team1, user_ids_team2, 
#     #                                     our_team_kind, opponent_team_kind, 
#     #                                     our_team_score, opponent_team_score, 
#     #                                     start_time, end_time, round_info_dict)

#     #     # 결과 검증
#     #     self.assertIsNotNone(game)
#     #     self.assertEqual(game.mode, mode)
#     #     self.assertEqual(game.start_at, start_time)
#     #     self.assertEqual(game.end_at, end_time)

#     #     teams = game.teams.all()
#     #     self.assertEqual(teams.count(), 2)
#     #     user1 = User.objects.get(id=user_ids_team1[0])
#     #     user2 = User.objects.get(id=user_ids_team1[1])
#     #     team_user = TeamUser.objects.filter(
#     #         user=user1,
#     #         team=teams.first()
#     #     ).select_related('team').first()
#     #     print("[TEAM]team_user.id", team_user.id, team_user.team.id, teams.first().id)
#     #     if team_user is not None:
#     #         team1 = team_user.team
#     #         team2 = teams[1]
#     #     else:
#     #         team2 = team_user.team
#     #         team1 = teams[1]

#     #     rounds = game.rounds.all()
#     #     self.assertEqual(rounds.count(), 2)

#     #     round1 = Round.objects.filter(
#     #         order=1,
#     #         game=game
#     #     ).select_related('win_team').first()
#     #     print(round1.id, round1.win_team.id, team1.id, team2.id)
#     #     round2 = Round.objects.filter(
#     #         order=2,
#     #         game=game
#     #     ).select_related('win_team').first()
#     #     self.assertEqual(round1.win_team, team1)
#     #     self.assertEqual(round2.win_team, team2)

#     #     ball_hits_round1 = round1.hits_round.all()
#     #     ball_hits_round2 = round2.hits_round.all()

#     #     self.assertEqual(ball_hits_round1.count(), 2)
#     #     self.assertEqual(ball_hits_round2.count(), 2)

#     #     self.assertEqual(ball_hits_round1[0].x_coordinate, 20.0)
#     #     self.assertEqual(ball_hits_round1[0].y_coordinate, 10.0)
#     #     self.assertEqual(ball_hits_round1[1].x_coordinate, 25.0)
#     #     self.assertEqual(ball_hits_round1[1].y_coordinate, 15.0)

#     #     self.assertEqual(ball_hits_round2[0].x_coordinate, 22.0)
#     #     self.assertEqual(ball_hits_round2[0].y_coordinate, 12.0)
#     #     self.assertEqual(ball_hits_round2[1].x_coordinate, 27.0)
#     #     self.assertEqual(ball_hits_round2[1].y_coordinate, 17.0)
    


#     def get_random_round_info(num_rounds=3):
#         teams = ["team1", "team2"]
#         types = ["hit", "miss"]

#         round_info_dict = {}
#         for i in range(1, num_rounds + 1):
#             round_info_dict[i] = {
#                 "win_team": random.choice(teams),
#                 "ball_hits": [
#                     {"type": random.choice(types), "y": round(random.uniform(5.0, 20.0), 2), "x": round(random.uniform(15.0, 30.0), 2)},
#                     {"type": random.choice(types), "y": round(random.uniform(5.0, 20.0), 2), "x": round(random.uniform(15.0, 30.0), 2)},
#                 ]
#             }
#         return round_info_dict
