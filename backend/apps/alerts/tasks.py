from celery import shared_task
from apps.sensors.models import SensorData
from .engine import check_sensor_alerts
from django.utils import timezone
from datetime import timedelta


@shared_task(name='apps.alerts.tasks.check_alerts')
def check_alerts():
    cutoff = timezone.now() - timedelta(seconds=10)
    recent = SensorData.objects.filter(timestamp__gte=cutoff).select_related('train')
    count = 0
    for sd in recent:
        check_sensor_alerts(sd)
        count += 1
    return f'Checked {count} sensor readings'
