# Generated by Django 4.2.14 on 2024-07-12 08:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('lobby', '0010_alter_message_content'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='win',
            field=models.IntegerField(default=0),
        ),
    ]
