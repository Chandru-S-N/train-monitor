import random
import math
from datetime import datetime, timezone as dt_timezone
from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.utils import timezone
from apps.trains.models import Train

TRAIN_ROUTES = {
    'TN-001': {
        'waypoints': [
            (19.0760, 72.8777), (20.5937, 72.9942), (21.1702, 72.8311),
            (22.3072, 73.1812), (23.3342, 75.0370), (24.5854, 73.7125),
            (25.2138, 75.8648), (26.9124, 75.7873), (28.7041, 77.1025),
        ],
        'base_temp': 65, 'base_pressure': 118, 'base_speed': 130,
    },
    'TN-002': {
        'waypoints': [
            (19.0760, 72.8777), (18.9220, 73.1228), (18.5204, 73.8567),
            (17.6868, 75.9065), (17.3297, 76.8343), (16.3088, 77.3872),
            (15.8281, 78.0373), (14.4426, 79.9865), (13.0827, 80.2707),
        ],
        'base_temp': 72, 'base_pressure': 112, 'base_speed': 110,
    },
    'TN-003': {
        'waypoints': [
            (18.5204, 73.8567), (18.6161, 73.7278), (18.7481, 73.4072),
            (18.9126, 73.3174), (18.9908, 73.1124), (19.0760, 72.8777),
        ],
        'base_temp': 58, 'base_pressure': 108, 'base_speed': 90,
    },
    'TN-004': {
        'waypoints': [
            (12.9716, 77.5946), (12.8253, 77.6672), (12.9684, 79.1446),
            (13.0827, 79.6728), (13.0952, 80.1095), (13.0827, 80.2707),
        ],
        'base_temp': 74, 'base_pressure': 115, 'base_speed': 120,
    },
    'TN-005': {
        'waypoints': [
            (22.5726, 88.3639), (23.2599, 87.0888), (23.7957, 86.4304),
            (24.7914, 85.0002), (25.4358, 81.8463), (26.4499, 80.3319),
            (27.1767, 78.0081), (28.4089, 77.3178), (28.7041, 77.1025),
        ],
        'base_temp': 68, 'base_pressure': 122, 'base_speed': 140,
    },
}

_train_positions = {k: 0.0 for k in TRAIN_ROUTES}
_anomaly_counter = {k: 0 for k in TRAIN_ROUTES}


def interpolate_position(waypoints, t):
    t = max(0.0, min(1.0, t))
    n = len(waypoints) - 1
    segment = min(int(t * n), n - 1)
    local_t = (t * n) - segment
    lat1, lon1 = waypoints[segment]
    lat2, lon2 = waypoints[segment + 1]
    return lat1 + (lat2 - lat1) * local_t, lon1 + (lon2 - lon1) * local_t


@shared_task(name='apps.sensors.tasks.simulate_sensor_data')
def simulate_sensor_data():
    from .models import SensorData, GPSHistory
    channel_layer = get_channel_layer()
    trains = Train.objects.filter(status='active')
    ts = datetime.now(dt_timezone.utc).timestamp()

    for train in trains:
        train_id = train.id
        if train_id not in TRAIN_ROUTES:
            continue

        info = TRAIN_ROUTES[train_id]
        
        # Load waypoints from DB Route model if available, else fallback
        try:
            from apps.geofencing.models import Route
            route_obj = Route.objects.filter(train=train).first()
            if route_obj and route_obj.waypoints:
                waypoints = route_obj.waypoints
            else:
                waypoints = info['waypoints']
        except Exception:
            waypoints = info['waypoints']

        _train_positions[train_id] = (_train_positions[train_id] + 0.0015) % 1.0
        lat, lon = interpolate_position(waypoints, _train_positions[train_id])
        lat += random.gauss(0, 0.0003)
        lon += random.gauss(0, 0.0003)

        time_wave = math.sin(ts / 120 + hash(train_id) % 10) * 4

        temp = info['base_temp'] + time_wave + random.gauss(0, 2)
        pressure = info['base_pressure'] + time_wave * 0.4 + random.gauss(0, 3)
        humidity = 45 + random.gauss(0, 8)
        vibration = 2.5 + abs(random.gauss(0, 1.5))
        smoke = 8 + abs(random.gauss(0, 5))
        speed = info['base_speed'] + random.gauss(0, 15)

        # Inject anomaly occasionally
        _anomaly_counter[train_id] += 1
        if _anomaly_counter[train_id] >= random.randint(40, 80):
            spike = random.choice(['temp', 'pressure', 'vibration', 'smoke'])
            if spike == 'temp':
                temp += random.uniform(25, 45)
            elif spike == 'pressure':
                pressure += random.uniform(50, 90)
            elif spike == 'vibration':
                vibration += random.uniform(6, 12)
            elif spike == 'smoke':
                smoke += random.uniform(45, 100)
            _anomaly_counter[train_id] = 0

        humidity = max(10, min(100, humidity))
        speed = max(0, min(200, speed))
        vibration = max(0, vibration)
        smoke = max(0, smoke)

        # Determine status
        if temp > 100 or pressure > 200 or vibration > 12 or smoke > 100:
            s_status = 'critical'
        elif temp > 80 or pressure > 150 or vibration > 7 or smoke > 50:
            s_status = 'warning'
        else:
            s_status = 'normal'

        sensor = SensorData.objects.create(
            train=train,
            temperature=round(temp, 2),
            pressure=round(pressure, 2),
            humidity=round(humidity, 2),
            vibration=round(vibration, 3),
            smoke=round(smoke, 2),
            latitude=round(lat, 6),
            longitude=round(lon, 6),
            speed=round(speed, 2),
            status=s_status,
        )

        if random.random() < 0.4:
            GPSHistory.objects.create(
                train=train,
                latitude=round(lat, 6),
                longitude=round(lon, 6),
                speed=round(speed, 2),
            )

        data = {
            'id': str(sensor.id),
            'train_id': train.id,
            'train_name': train.name,
            'train_route': train.route_name,
            'temperature': sensor.temperature,
            'pressure': sensor.pressure,
            'humidity': sensor.humidity,
            'vibration': sensor.vibration,
            'smoke': sensor.smoke,
            'latitude': sensor.latitude,
            'longitude': sensor.longitude,
            'speed': sensor.speed,
            'status': s_status,
            'timestamp': sensor.timestamp.isoformat(),
        }

        try:
            async_to_sync(channel_layer.group_send)('sensors', {'type': 'sensor_update', 'data': data})
        except Exception:
            pass


@shared_task(name='apps.sensors.tasks.cleanup_old_data')
def cleanup_old_data():
    """Keep only last 7 days of sensor data"""
    from .models import SensorData, GPSHistory
    cutoff = timezone.now() - timezone.timedelta(days=7)
    deleted_s, _ = SensorData.objects.filter(timestamp__lt=cutoff).delete()
    deleted_g, _ = GPSHistory.objects.filter(timestamp__lt=cutoff).delete()
    return f'Cleaned {deleted_s} sensor records, {deleted_g} GPS records'
