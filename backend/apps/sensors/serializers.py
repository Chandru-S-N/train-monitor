from rest_framework import serializers
from .models import SensorData, GPSHistory


class SensorDataSerializer(serializers.ModelSerializer):
    train_id    = serializers.CharField(source='train.id',         read_only=True)
    train_name  = serializers.CharField(source='train.name',       read_only=True)
    train_route = serializers.CharField(source='train.route_name', read_only=True)

    class Meta:
        model  = SensorData
        fields = [
            'id', 'train_id', 'train_name', 'train_route',
            'temperature', 'pressure', 'humidity', 'vibration',
            'smoke', 'latitude', 'longitude', 'speed',
            'status', 'timestamp',
        ]


class GPSHistorySerializer(serializers.ModelSerializer):
    train_id   = serializers.CharField(source='train.id',   read_only=True)
    train_name = serializers.CharField(source='train.name', read_only=True)

    class Meta:
        model  = GPSHistory
        fields = ['id', 'train_id', 'train_name', 'latitude', 'longitude', 'speed', 'timestamp']
