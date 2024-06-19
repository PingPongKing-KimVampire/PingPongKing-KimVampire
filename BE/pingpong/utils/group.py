from utils.printer import Printer

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
    discard_group(consumer, old_group)
    add_group(consumer, new_group)
    return new_group

async def notify_group(consumer, group, event, content):
    Printer.log(f"!!!!! notify group !!!!!", "pink")
    Printer.log(f"group: {group}", "pink")
    Printer.log(f"event: {event}", "pink")
    Printer.log(f"content: {content}", "pink")
    await consumer.channel_layer.group_send(
        group,
        {
            'event': event,
            'content': content
        }
    )
    
async def notify_group(consumer, group, event, content):
    await consumer.channel_layer.group_send(
        group,
        {
            'event': event,
            'content': content
        }
    )