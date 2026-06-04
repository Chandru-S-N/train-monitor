from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
import django_filters
from .models import Alert
from .serializers import AlertSerializer
from apps.users.permissions import IsMaintenanceOrAbove


class AlertFilter(django_filters.FilterSet):
    train_id = django_filters.CharFilter(field_name='train__id')
    severity = django_filters.CharFilter()
    is_resolved = django_filters.BooleanFilter()
    is_acknowledged = django_filters.BooleanFilter()
    alert_type = django_filters.CharFilter()
    date_from = django_filters.DateTimeFilter(field_name='timestamp', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(field_name='timestamp', lookup_expr='lte')

    class Meta:
        model = Alert
        fields = ['severity', 'is_resolved', 'is_acknowledged', 'alert_type']


class AlertListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AlertSerializer
    filterset_class = AlertFilter
    queryset = Alert.objects.select_related('train').all()


class AlertStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Alert.objects.all()
        unresolved = qs.filter(is_resolved=False)
        return Response({
            'total': qs.count(),
            'unresolved': unresolved.count(),
            'critical': unresolved.filter(severity='critical').count(),
            'high': unresolved.filter(severity='high').count(),
            'medium': unresolved.filter(severity='medium').count(),
            'low': unresolved.filter(severity='low').count(),
        })


class AlertAcknowledgeView(APIView):
    """All authenticated roles can acknowledge alerts."""
    permission_classes = [IsMaintenanceOrAbove]

    def post(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk)
        except Alert.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        alert.is_acknowledged = True
        alert.acknowledged_at = timezone.now()
        alert.save()
        return Response(AlertSerializer(alert).data)


class AlertResolveView(APIView):
    """All authenticated roles can resolve alerts."""
    permission_classes = [IsMaintenanceOrAbove]

    def post(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk)
        except Alert.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        alert.is_resolved = True
        alert.resolved_at = timezone.now()
        # Accept optional resolve_reason from request body
        reason = request.data.get('reason', '')
        if reason:
            alert.details = {**alert.details, 'resolve_reason': reason, 'resolved_by': request.user.username}
        alert.save()
        return Response(AlertSerializer(alert).data)
