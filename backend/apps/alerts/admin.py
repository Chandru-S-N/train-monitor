from django.contrib import admin
from .models import Alert

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['train', 'alert_type', 'severity', 'is_acknowledged', 'is_resolved', 'timestamp']
    list_filter = ['severity', 'is_resolved', 'alert_type']
    ordering = ['-timestamp']
