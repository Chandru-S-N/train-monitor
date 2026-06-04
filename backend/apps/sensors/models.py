import uuid
from django.db import models
from apps.trains.models import Train

class SensorData(models.Model):
    STATUS_CHOICES = [
        ('normal', 'Normal'),
        ('warning', 'Warning'),
        ('critical', 'Critical'),
        ('offline', 'Offline'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    train = models.ForeignKey(Train, on_delete=models.CASCADE, related_name='sensor_data')
    temperature = models.FloatField()
    pressure = models.FloatField()
    humidity = models.FloatField()
    vibration = models.FloatField()
    smoke = models.FloatField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    speed = models.FloatField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='normal')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sensor_data'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['train', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]

class GPSHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    train = models.ForeignKey(Train, on_delete=models.CASCADE, related_name='gps_history')
    latitude = models.FloatField()
    longitude = models.FloatField()
    speed = models.FloatField(default=0)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'gps_history'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['train', '-timestamp']),
        ]
