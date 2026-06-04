from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
import django_filters
from .models import MaintenanceLog
from .serializers import MaintenanceLogSerializer
from apps.users.permissions import IsAdminOrMaintenance, IsMaintenanceOrAbove


class MaintenanceLogFilter(django_filters.FilterSet):
    train_id = django_filters.CharFilter(field_name='train__id')
    status = django_filters.CharFilter()
    priority = django_filters.CharFilter()
    maintenance_type = django_filters.CharFilter()
    assigned_to = django_filters.UUIDFilter(field_name='assigned_to__id')

    class Meta:
        model = MaintenanceLog
        fields = ['status', 'priority', 'maintenance_type']


class MaintenanceLogListCreateView(generics.ListCreateAPIView):
    """
    GET  — All authenticated users can view logs.
    POST — Only admin + maintenance can create logs.
    """
    serializer_class = MaintenanceLogSerializer
    filterset_class = MaintenanceLogFilter
    queryset = MaintenanceLog.objects.select_related('train', 'reported_by', 'assigned_to').all()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrMaintenance()]
        return [permissions.IsAuthenticated()]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class MaintenanceLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    — All authenticated users.
    PATCH  — Admin + maintenance.
    DELETE — Admin only.
    """
    serializer_class = MaintenanceLogSerializer
    queryset = MaintenanceLog.objects.select_related('train', 'reported_by', 'assigned_to').all()

    def get_permissions(self):
        if self.request.method == 'DELETE':
            from apps.users.permissions import IsAdminRole
            return [IsAdminRole()]
        if self.request.method in ['PUT', 'PATCH']:
            return [IsAdminOrMaintenance()]
        return [permissions.IsAuthenticated()]

    def perform_update(self, serializer):
        # Auto-set completed_at when status becomes completed
        instance = self.get_object()
        new_status = self.request.data.get('status', instance.status)
        if new_status == 'completed' and instance.status != 'completed':
            serializer.save(completed_at=timezone.now())
        else:
            serializer.save()


class MaintenanceStatsView(APIView):
    """Summary counts for the maintenance dashboard widget."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = MaintenanceLog.objects.all()
        return Response({
            'total': qs.count(),
            'open': qs.filter(status='open').count(),
            'in_progress': qs.filter(status='in_progress').count(),
            'completed': qs.filter(status='completed').count(),
            'critical': qs.filter(priority='critical', status__in=['open', 'in_progress']).count(),
            'high': qs.filter(priority='high', status__in=['open', 'in_progress']).count(),
        })
