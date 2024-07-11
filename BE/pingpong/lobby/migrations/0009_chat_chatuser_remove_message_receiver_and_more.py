# Generated by Django 4.2.13 on 2024-07-04 07:59

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('lobby', '0008_alter_blockedrelationship_blocked_user_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Chat',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='ChatUser',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
            ],
        ),
        migrations.RemoveField(
            model_name='message',
            name='receiver',
        ),
        migrations.AddField(
            model_name='message',
            name='is_read',
            field=models.BooleanField(default=False),
        ),
        migrations.AddConstraint(
            model_name='blockedrelationship',
            constraint=models.UniqueConstraint(fields=('blocker', 'blocked_user'), name='unique_block_realtionship'),
        ),
        migrations.AddField(
            model_name='chatuser',
            name='chat',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chat_chat', to='lobby.chat'),
        ),
        migrations.AddField(
            model_name='chatuser',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chat_user', to='lobby.user'),
        ),
        migrations.AddField(
            model_name='message',
            name='chat',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='lobby.chat'),
        ),
        migrations.AddConstraint(
            model_name='chatuser',
            constraint=models.UniqueConstraint(fields=('chat', 'user'), name='unique_chat_user'),
        ),
    ]