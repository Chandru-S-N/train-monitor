from rest_framework import serializers
from .models import Train

class TrainSerializer(serializers.ModelSerializer):
    waypoints = serializers.SerializerMethodField()

    class Meta:
        model = Train
        fields = ['id', 'name', 'route_name', 'description', 'status', 'waypoints', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    def get_waypoints(self, obj):
        route = getattr(obj, 'route', None)
        return route.waypoints if route else []

