# Generated by Django 4.2.14 on 2024-07-12 10:53

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('lobby', '0010_alter_message_content'),
    ]

    operations = [
        migrations.CreateModel(
            name='Game',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('start_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('end_at', models.DateTimeField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Team',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('game', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='teams', to='lobby.game')),
            ],
        ),
        migrations.CreateModel(
            name='TeamUser',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('team', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='members', to='lobby.team')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='teams', to='lobby.user')),
            ],
        ),
        migrations.CreateModel(
            name='Round',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('game', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='rounds', to='lobby.game')),
                ('win_team', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='wins', to='lobby.team')),
            ],
        ),
        migrations.CreateModel(
            name='BallHit',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('x_coordinate', models.DecimalField(decimal_places=6, max_digits=10)),
                ('y_coordinate', models.DecimalField(decimal_places=6, max_digits=10)),
                ('round', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='hits_round', to='lobby.round')),
                ('team', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='hits_team', to='lobby.team')),
            ],
        ),
    ]