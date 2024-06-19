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

async def change_group(consumer, old_group, new_group):
    Printer.log("someone change group old to new", "cyan")
    await discard_group(consumer, old_group)
    await add_group(consumer, new_group)
    return new_group

async def notify_group(channel_layer, group, event, content):
    Printer.log(f"!!!!! notify group !!!!!", "cyan")
    Printer.log(f"group: {group}", "cyan")
    Printer.log(f"type: {event}", "cyan")
    Printer.log(f"content: {content}", "cyan")
    await channel_layer.group_send(
        group,
        {
            'type': event,
            'content': json.dumps(content)
        }
    )