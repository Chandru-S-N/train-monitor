import uuid
from django.db import models
from apps.trains.models import Train
from apps.users.models import User


class MaintenanceLog(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('deferred', 'Deferred'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    TYPE_CHOICES = [
        ('inspection', 'Routine Inspection'),
        ('repair', 'Repair'),
        ('replacement', 'Parts Replacement'),
        ('calibration', 'Sensor Calibration'),
        ('emergency', 'Emergency Fix'),
        ('preventive', 'Preventive Maintenance'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    train = models.ForeignKey(Train, on_delete=models.CASCADE, related_name='maintenance_logs')
    reported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='reported_logs')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_logs')

    maintenance_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='inspection')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='open')

    issue_description = models.TextField()
    work_done = models.TextField(blank=True, default='')
    parts_used = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')

    scheduled_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'maintenance_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['train', '-created_at']),
            models.Index(fields=['status', 'priority']),
        ]

    def __str__(self):
        return f"[{self.priority.upper()}] {self.train} - {self.maintenance_type} ({self.status})"
