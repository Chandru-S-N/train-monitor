import json
import paho.mqtt.client as mqtt
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.trains.models import Train
from apps.sensors.models import SensorData, GPSHistory
from apps.alerts.engine import check_sensor_alerts
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class Command(BaseCommand):
    help = 'Starts the MQTT listener daemon to ingest real-time IoT sensor data'

    def handle(self, *args, **options):
        client = mqtt.Client()
        client.on_connect = self.on_connect
        client.on_message = self.on_message

        # Setup authentication if credentials are provided in settings
        if settings.MQTT_USERNAME:
            client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)

        host = settings.MQTT_BROKER_HOST
        port = settings.MQTT_BROKER_PORT
        keepalive = getattr(settings, 'MQTT_KEEPALIVE', 60)

        self.stdout.write(self.style.WARNING(f"Connecting to MQTT broker at {host}:{port}..."))
        try:
            client.connect(host, port, keepalive)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Connection failed: {e}"))
            return

        try:
            client.loop_forever()
        except KeyboardInterrupt:
            self.stdout.write(self.style.SUCCESS("Exiting MQTT listener..."))

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.stdout.write(self.style.SUCCESS("Successfully connected to MQTT Broker!"))
            topic = settings.MQTT_TOPIC
            client.subscribe(topic)
            self.stdout.write(self.style.SUCCESS(f"Subscribed to topic: {topic}"))
        else:
            self.stderr.write(self.style.ERROR(f"Failed to connect, return code {rc}"))

    def on_message(self, client, userdata, msg):
        try:
            payload_str = msg.payload.decode('utf-8')
            payload = json.loads(payload_str)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Failed to decode/parse payload: {e}"))
            return

        # Extract train_id from topic (e.g. trains/TN-001/telemetry)
        topic_parts = msg.topic.split('/')
        train_id = None
        if len(topic_parts) >= 3 and topic_parts[0] == 'trains' and topic_parts[2] == 'telemetry':
            train_id = topic_parts[1]
        
        # Fallback to payload if not available in topic structure
        if not train_id:
            train_id = payload.get('train_id')

        if not train_id:
            self.stderr.write(self.style.ERROR("Could not determine train_id from topic or payload."))
            return

        try:
            train = Train.objects.get(id=train_id)
        except Train.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"Train with ID '{train_id}' does not exist. Ignoring telemetry."))
            return

        # Extract values
        temp = float(payload.get('temperature', 0))
        pressure = float(payload.get('pressure', 0))
        humidity = float(payload.get('humidity', 0))
        vibration = float(payload.get('vibration', 0))
        smoke = float(payload.get('smoke', 0))
        lat = float(payload.get('latitude', 0))
        lon = float(payload.get('longitude', 0))
        speed = float(payload.get('speed', 0))

        # Determine status based on settings ALERT_THRESHOLDS
        thresholds = getattr(settings, 'ALERT_THRESHOLDS', {})
        status = 'normal'
        for key, val in [
            ('temperature', temp),
            ('pressure', pressure),
            ('vibration', vibration),
            ('smoke', smoke),
        ]:
            rules = thresholds.get(key, {})
            if val >= rules.get('critical', float('inf')):
                status = 'critical'
                break
            elif val >= rules.get('high', float('inf')):
                if status != 'critical':
                    status = 'warning'

        # Store reading to DB
        sensor_data = SensorData.objects.create(
            train=train,
            temperature=round(temp, 2),
            pressure=round(pressure, 2),
            humidity=round(humidity, 2),
            vibration=round(vibration, 3),
            smoke=round(smoke, 2),
            latitude=round(lat, 6),
            longitude=round(lon, 6),
            speed=round(speed, 2),
            status=status
        )

        # Record GPS location history
        GPSHistory.objects.create(
            train=train,
            latitude=round(lat, 6),
            longitude=round(lon, 6),
            speed=round(speed, 2)
        )

        # Evaluate and trigger alerts
        check_sensor_alerts(sensor_data)

        # Broadcast via WebSockets
        data = {
            'id': str(sensor_data.id),
            'train_id': train.id,
            'train_name': train.name,
            'train_route': train.route_name,
            'temperature': sensor_data.temperature,
            'pressure': sensor_data.pressure,
            'humidity': sensor_data.humidity,
            'vibration': sensor_data.vibration,
            'smoke': sensor_data.smoke,
            'latitude': sensor_data.latitude,
            'longitude': sensor_data.longitude,
            'speed': sensor_data.speed,
            'status': status,
            'timestamp': sensor_data.timestamp.isoformat(),
        }

        channel_layer = get_channel_layer()
        try:
            async_to_sync(channel_layer.group_send)(
                'sensors',
                {
                    'type': 'sensor_update',
                    'data': data
                }
            )
        except Exception as e:
            self.stderr.write(f"WebSocket broadcast failed: {e}")

        self.stdout.write(self.style.SUCCESS(
            f"Successfully processed reading for {train_id} (Temp: {temp}, Status: {status})"
        ))
