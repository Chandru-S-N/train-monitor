from rest_framework import serializers
from .models import Alert

class AlertSerializer(serializers.ModelSerializer):
    train_name = serializers.CharField(source='train.name', read_only=True)
    train_route = serializers.CharField(source='train.route_name', read_only=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)

    class Meta:
        model = Alert
        fields = '__all__'
