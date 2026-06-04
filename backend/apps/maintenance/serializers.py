from rest_framework import serializers
from .models import MaintenanceLog
from apps.users.serializers import UserSerializer


class MaintenanceLogSerializer(serializers.ModelSerializer):
    train_name = serializers.CharField(source='train.name', read_only=True)
    train_id_str = serializers.CharField(source='train.id', read_only=True)
    reported_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = MaintenanceLog
        fields = [
            'id', 'train', 'train_name', 'train_id_str',
            'reported_by', 'reported_by_name',
            'assigned_to', 'assigned_to_name',
            'maintenance_type', 'priority', 'status',
            'issue_description', 'work_done', 'parts_used', 'notes',
            'scheduled_date', 'completed_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'reported_by']

    def get_reported_by_name(self, obj):
        return obj.reported_by.username if obj.reported_by else '—'

    def get_assigned_to_name(self, obj):
        return obj.assigned_to.username if obj.assigned_to else 'Unassigned'

    def create(self, validated_data):
        # Auto-set reported_by to current user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['reported_by'] = request.user
        return super().create(validated_data)
