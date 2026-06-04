from django.contrib import admin
from .models import Train

@admin.register(Train)
class TrainAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'route_name', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['id', 'name', 'route_name']
