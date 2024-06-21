from utils.printer import Printer
import json

async def add_group(consumer, group):
    await consumer.channel_layer.group_add(
        group,
        consumer.channel_name
    )
    return group

async def discard_group(consumer, group):
    await consumer.channel_layer.group_discard(
        group,
        consumer.channel_name
    )
    return group

async def notify_group(channel_layer, group, event, content):
    Printer.log(f"type: {event}", "white")
    Printer.log(f"content: {content}\n", "white")
    await channel_layer.group_send(
        group,
        {
            'type': event,
            'content': json.dumps(content)
        }
    )