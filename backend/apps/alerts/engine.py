from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Alert
from apps.geofencing.models import Route, GeoFenceZone
from apps.geofencing.utils import distance_to_route, point_in_polygon

THRESHOLDS = {
    'temperature': {'medium': 70, 'high': 80, 'critical': 100},
    'pressure':    {'medium': 130, 'high': 150, 'critical': 200},
    'vibration':   {'medium': 5, 'high': 7, 'critical': 12},
    'smoke':       {'medium': 30, 'high': 50, 'critical': 100},
    'speed':       {'medium': 160, 'high': 180, 'critical': 200},
}

TYPE_MESSAGES = {
    'temperature': ('temperature', 'High Temperature'),
    'pressure':    ('pressure', 'High Pressure'),
    'vibration':   ('vibration', 'Dangerous Vibration'),
    'smoke':       ('smoke', 'Smoke/Gas Alert'),
    'speed':       ('speed', 'Speed Violation'),
}


def get_severity(value, thresholds):
    if value >= thresholds.get('critical', float('inf')):
        return 'critical'
    if value >= thresholds.get('high', float('inf')):
        return 'high'
    if value >= thresholds.get('medium', float('inf')):
        return 'medium'
    return None


def broadcast_alert(alert):
    from apps.alerts.serializers import AlertSerializer
    channel_layer = get_channel_layer()
    try:
        async_to_sync(channel_layer.group_send)('alerts', {
            'type': 'new_alert',
            'data': AlertSerializer(alert).data,
        })
    except Exception:
        pass


def check_sensor_alerts(sensor_data):
    # 1. Check basic sensor threshold alerts
    checks = [
        ('temperature', sensor_data.temperature),
        ('pressure', sensor_data.pressure),
        ('vibration', sensor_data.vibration),
        ('smoke', sensor_data.smoke),
        ('speed', sensor_data.speed),
    ]

    for key, value in checks:
        severity = get_severity(value, THRESHOLDS[key])
        if not severity:
            continue

        # Deduplicate: skip if unresolved alert of same type+train exists
        exists = Alert.objects.filter(
            train=sensor_data.train,
            alert_type=key,
            is_resolved=False,
        ).exists()
        if exists:
            continue

        alert_type, display = TYPE_MESSAGES[key]
        alert = Alert.objects.create(
            train=sensor_data.train,
            alert_type=alert_type,
            severity=severity,
            message=f"{display} on {sensor_data.train.name}: {value:.1f} (threshold exceeded)",
            details={'value': value, 'sensor': key, 'train_id': sensor_data.train.id},
        )
        broadcast_alert(alert)

    # 2. Check Route Deviations
    try:
        route = Route.objects.filter(train=sensor_data.train).first()
        if route and route.waypoints:
            dist = distance_to_route(sensor_data.latitude, sensor_data.longitude, route.waypoints)
            if dist > 15.0:  # 15km threshold for route deviation
                exists = Alert.objects.filter(
                    train=sensor_data.train,
                    alert_type='route_deviation',
                    is_resolved=False,
                ).exists()
                if not exists:
                    alert = Alert.objects.create(
                        train=sensor_data.train,
                        alert_type='route_deviation',
                        severity='high',
                        message=f"Route deviation on {sensor_data.train.name}: {dist:.1f} km away from course",
                        details={'distance_km': dist, 'lat': sensor_data.latitude, 'lon': sensor_data.longitude},
                    )
                    broadcast_alert(alert)
    except Exception:
        pass

    # 3. Check GeoFence Violations
    try:
        zones = GeoFenceZone.objects.filter(is_active=True)
        for zone in zones:
            if zone.boundary and point_in_polygon(sensor_data.latitude, sensor_data.longitude, zone.boundary):
                exists = Alert.objects.filter(
                    train=sensor_data.train,
                    alert_type='restricted_zone',
                    is_resolved=False,
                ).exists()
                if not exists:
                    severity = 'critical' if zone.zone_type == 'restricted' else 'high'
                    alert = Alert.objects.create(
                        train=sensor_data.train,
                        alert_type='restricted_zone',
                        severity=severity,
                        message=f"{zone.get_zone_type_display()} Breach: {sensor_data.train.name} entered {zone.name}",
                        details={'zone_name': zone.name, 'zone_type': zone.zone_type, 'lat': sensor_data.latitude, 'lon': sensor_data.longitude},
                    )
                    broadcast_alert(alert)
    except Exception:
        pass

