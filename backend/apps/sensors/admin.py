from django.contrib import admin
from .models import SensorData, GPSHistory

@admin.register(SensorData)
class SensorDataAdmin(admin.ModelAdmin):
    list_display = ['train', 'temperature', 'pressure', 'status', 'timestamp']
    list_filter = ['status', 'train']
    ordering = ['-timestamp']

@admin.register(GPSHistory)
class GPSHistoryAdmin(admin.ModelAdmin):
    list_display = ['train', 'latitude', 'longitude', 'speed', 'timestamp']
    ordering = ['-timestamp']
