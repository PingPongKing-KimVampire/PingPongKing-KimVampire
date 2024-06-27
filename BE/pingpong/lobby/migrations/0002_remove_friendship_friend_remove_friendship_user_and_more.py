# Generated by Django 4.2.13 on 2024-06-26 04:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('lobby', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='friendship',
            name='friend',
        ),
        migrations.RemoveField(
            model_name='friendship',
            name='user',
        ),
        migrations.RemoveField(
            model_name='match',
            name='game',
        ),
        migrations.RemoveField(
            model_name='match',
            name='team',
        ),
        migrations.RemoveField(
            model_name='match',
            name='user',
        ),
        migrations.RemoveField(
            model_name='message',
            name='receiver',
        ),
        migrations.RemoveField(
            model_name='message',
            name='sender',
        ),
        migrations.RemoveField(
            model_name='round',
            name='game',
        ),
        migrations.RemoveField(
            model_name='round',
            name='win_team',
        ),
        migrations.RemoveField(
            model_name='team',
            name='game',
        ),
        migrations.RemoveField(
            model_name='teamuser',
            name='team',
        ),
        migrations.RemoveField(
            model_name='teamuser',
            name='user',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='user',
        ),
        migrations.RemoveField(
            model_name='userstat',
            name='user',
        ),
        migrations.RemoveField(
            model_name='user',
            name='image',
        ),
        migrations.RemoveField(
            model_name='user',
            name='name',
        ),
        migrations.AddField(
            model_name='user',
            name='image_uri',
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='nickname',
            field=models.CharField(max_length=20, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='user',
            name='password',
            field=models.CharField(max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='username',
            field=models.CharField(max_length=20, null=True, unique=True),
        ),
        migrations.DeleteModel(
            name='BlockedUser',
        ),
        migrations.DeleteModel(
            name='Friendship',
        ),
        migrations.DeleteModel(
            name='Game',
        ),
        migrations.DeleteModel(
            name='Match',
        ),
        migrations.DeleteModel(
            name='Message',
        ),
        migrations.DeleteModel(
            name='Round',
        ),
        migrations.DeleteModel(
            name='Team',
        ),
        migrations.DeleteModel(
            name='TeamUser',
        ),
        migrations.DeleteModel(
            name='UserProfile',
        ),
        migrations.DeleteModel(
            name='UserStat',
        ),
    ]
