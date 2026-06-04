import uuid
from django.db import models
from apps.trains.models import Train


class Route(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    train = models.OneToOneField(Train, on_delete=models.CASCADE, related_name='route')
    waypoints = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'routes'

    def __str__(self):
        return f"Route for {self.train}"


class GeoFenceZone(models.Model):
    ZONE_TYPES = [
        ('restricted', 'Restricted Zone'),
        ('maintenance', 'Maintenance Area'),
        ('hazard', 'Hazard Zone'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    zone_type = models.CharField(max_length=20, choices=ZONE_TYPES)
    boundary = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'geofence_zones'
