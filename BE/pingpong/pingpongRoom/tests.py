import pytest
import datetime
from django.test import TestCase
from lobby.models import User, Game, Team, TeamUser, Round, BallHit
from .repositories import GameRepository, TeamRepository

class TestGameRepository(TestCase):

    @pytest.mark.django_db(transaction=True)
    def test_save_game(self):
        # 테스트 데이터 생성
        user_ids_team1 = [User.objects.create(username=f'user_team1_{i}', password='password').id for i in range(4)]
        user_ids_team2 = [User.objects.create(username=f'user_team2_{i}', password='password').id for i in range(4)]

        mode = 'HUMAN_HUMAN'
        our_team_ability = 'none'
        opponent_team_ability = 'none'
        our_team_kind = 'HUMAN'
        opponent_team_kind = 'HUMAN'
        our_team_score = 10
        opponent_team_score = 8
        start_time = datetime.datetime.now()
        end_time = datetime.datetime.now()

        round_info_dict = {
            1: {
                "win_team": "team1",
                "ball_hits": [
                    {"type": "hit", "y": 10.0, "x": 20.0},
                    {"type": "miss", "y": 15.0, "x": 25.0},
                ]
            },
            2: {
                "win_team": "team2",
                "ball_hits": [
                    {"type": "hit", "y": 12.0, "x": 22.0},
                    {"type": "miss", "y": 17.0, "x": 27.0},
                ]
            }
        }

        # 게임 저장
        game = GameRepository.save_game(mode, our_team_ability, opponent_team_ability, 
                                        user_ids_team1, user_ids_team2, 
                                        our_team_kind, opponent_team_kind, 
                                        our_team_score, opponent_team_score, 
                                        start_time, end_time, round_info_dict)

        # 결과 검증
        self.assertIsNotNone(game)
        self.assertEqual(game.mode, mode)
        self.assertEqual(game.start_at, start_time)
        self.assertEqual(game.end_at, end_time)

        teams = game.teams.all()
        self.assertEqual(teams.count(), 2)
        user1 = User.objects.get(id=user_ids_team1[0])
        user2 = User.objects.get(id=user_ids_team1[1])
        team_user = TeamUser.objects.filter(
            user=user1,
            team=teams.first()
        ).select_related('team').first()
        print("[TEAM]team_user.id", team_user.id, team_user.team.id, teams.first().id)
        if team_user is not None:
            team1 = team_user.team
            team2 = teams[1]
        else:
            team2 = team_user.team
            team1 = teams[1]

        rounds = game.rounds.all()
        self.assertEqual(rounds.count(), 2)

        round1 = Round.objects.filter(
            order=1,
            game=game
        ).select_related('win_team').first()
        print(round1.id, round1.win_team.id, team1.id, team2.id)
        round2 = Round.objects.filter(
            order=2,
            game=game
        ).select_related('win_team').first()
        self.assertEqual(round1.win_team, team1)
        self.assertEqual(round2.win_team, team2)

        ball_hits_round1 = round1.hits_round.all()
        ball_hits_round2 = round2.hits_round.all()

        self.assertEqual(ball_hits_round1.count(), 2)
        self.assertEqual(ball_hits_round2.count(), 2)

        self.assertEqual(ball_hits_round1[0].x_coordinate, 20.0)
        self.assertEqual(ball_hits_round1[0].y_coordinate, 10.0)
        self.assertEqual(ball_hits_round1[1].x_coordinate, 25.0)
        self.assertEqual(ball_hits_round1[1].y_coordinate, 15.0)

        self.assertEqual(ball_hits_round2[0].x_coordinate, 22.0)
        self.assertEqual(ball_hits_round2[0].y_coordinate, 12.0)
        self.assertEqual(ball_hits_round2[1].x_coordinate, 27.0)
        self.assertEqual(ball_hits_round2[1].y_coordinate, 17.0)
