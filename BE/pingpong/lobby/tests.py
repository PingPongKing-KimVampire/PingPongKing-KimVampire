from django.test import TestCase

# Create your tests here.
import pytest
from lobby.models import User, Game, Team, TeamUser, Round, BallHit
from .repositories import GameRepository, TeamRepository

@pytest.mark.django_db
@pytest.mark.asyncio
class TestGameRepository:

    async def test_get_games_by_user_id(self):
        user = await sync_to_async(User.objects.create)(username='testuser')
        game = await sync_to_async(Game.objects.create)(mode='HUMAN', effect='none')
        team = await sync_to_async(Team.objects.create)(game=game, kind='HUMAN')
        await sync_to_async(TeamUser.objects.create)(team=team, user=user)
        
        games = await GameRepository.get_games_by_user_id(user.id)
        
        assert len(games) == 1
        assert games[0] == game

    async def test_create_game(self):
        user1 = await sync_to_async(User.objects.create)(username='user1')
        user2 = await sync_to_async(User.objects.create)(username='user2')
        
        mode = 'HUMAN'
        effect = 'none'
        our_user_id_list = [user1.id]
        opponent_user_id_list = [user2.id]
        our_team_kind = 'HUMAN'
        opponent_team_kind = 'VAMPIRE'
        
        game = await GameRepository.create_game(mode, effect, our_user_id_list, opponent_user_id_list, our_team_kind, opponent_team_kind)
        
        assert game is not None
        assert game.mode == mode
        assert game.effect == effect
        assert game.teams.count() == 2

    async def test_create_round(self):
        game = await sync_to_async(Game.objects.create)(mode='HUMAN', effect='none')
        
        round_order = 1
        round = await GameRepository.create_round(game.id, round_order)
        
        assert round is not None
        assert round.game == game
        assert round.order == round_order

    async def test_end_game(self):
        game = await sync_to_async(Game.objects.create)(mode='HUMAN', effect='none')
        
        await GameRepository.end_game(game.id)
        
        game = await sync_to_async(Game.objects.get)(id=game.id)
        assert game.end_at is not None

    async def test_end_round(self):
        game = await sync_to_async(Game.objects.create)(mode='HUMAN', effect='none')
        team = await sync_to_async(Team.objects.create)(game=game, kind='HUMAN')
        round = await sync_to_async(Round.objects.create)(game=game, order=1)
        
        await GameRepository.end_round(round.id, team.id)
        
        round = await sync_to_async(Round.objects.get)(id=round.id)
        assert round.win_team == team

    async def test_save_hit(self):
        game = await sync_to_async(Game.objects.create)(mode='HUMAN', effect='none')
        team = await sync_to_async(Team.objects.create)(game=game, kind='HUMAN')
        round = await sync_to_async(Round.objects.create)(game=game, order=1)
        
        y_coordinate = 12.345678
        x_coordinate = 98.765432
        
        await GameRepository.save_hit(round.id, team.id, y_coordinate, x_coordinate)
        
        hit = await sync_to_async(BallHit.objects.get)(round=round, team=team)
        assert hit.y_coordinate == y_coordinate
        assert hit.x_coordinate == x_coordinate

@pytest.mark.django_db
class TestTeamRepository:

    def test_create_team(self):
        user1 = User.objects.create(username='user1')
        user2 = User.objects.create(username='user2')
        game = Game.objects.create(mode='HUMAN', effect='none')
        user_id_list = [user1.id, user2.id]
        kind = 'HUMAN'
        
        team = TeamRepository.create_team(user_id_list, game, kind)
        
        assert team is not None
        assert team.game == game
        assert team.kind == kind
        assert team.members.count() == 2
        assert User.objects.get(id=user1.id) in [tu.user for tu in team.members.all()]
        assert User.objects.get(id=user2.id) in [tu.user for tu in team.members.all()]
