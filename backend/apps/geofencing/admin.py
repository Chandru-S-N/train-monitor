from django.contrib import admin
from .models import Route, GeoFenceZone

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['train', 'created_at']

@admin.register(GeoFenceZone)
class GeoFenceZoneAdmin(admin.ModelAdmin):
    list_display = ['name', 'zone_type', 'is_active']
    list_filter = ['zone_type', 'is_active']
