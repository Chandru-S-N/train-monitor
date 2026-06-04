import uuid
from django.db import models
from apps.trains.models import Train

class Alert(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    TYPE_CHOICES = [
        ('temperature', 'High Temperature'),
        ('pressure', 'High Pressure'),
        ('vibration', 'High Vibration'),
        ('smoke', 'Smoke/Gas Detected'),
        ('signal_loss', 'Signal Loss'),
        ('route_deviation', 'Route Deviation'),
        ('restricted_zone', 'Restricted Zone Entry'),
        ('sensor_failure', 'Sensor Failure'),
        ('speed', 'Speed Violation'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    train = models.ForeignKey(Train, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    message = models.TextField()
    details = models.JSONField(default=dict, blank=True)
    is_acknowledged = models.BooleanField(default=False)
    is_resolved = models.BooleanField(default=False)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'alerts'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['train', '-timestamp']),
            models.Index(fields=['severity', 'is_resolved']),
        ]

    def __str__(self):
        return f"[{self.severity.upper()}] {self.train} - {self.alert_type}"
