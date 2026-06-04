import json
from channels.generic.websocket import AsyncWebsocketConsumer

class SensorConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add('sensors', self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({'type': 'connected', 'message': 'Connected to sensor feed'}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard('sensors', self.channel_name)

    async def receive(self, text_data):
        pass  # Server-push only

    async def sensor_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'sensor_update',
            'data': event['data'],
        }))

class AlertConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add('alerts', self.channel_name)
        await self.accept()
        await self.send(text_data=json.dumps({'type': 'connected', 'message': 'Connected to alert feed'}))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard('alerts', self.channel_name)

    async def new_alert(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_alert',
            'data': event['data'],
        }))
