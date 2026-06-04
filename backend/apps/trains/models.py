from django.db import models

class Train(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('idle', 'Idle'),
        ('maintenance', 'Under Maintenance'),
        ('offline', 'Offline'),
    ]

    id = models.CharField(max_length=20, primary_key=True)
    name = models.CharField(max_length=100)
    route_name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'trains'

    def __str__(self):
        return f"{self.id} - {self.name}"
