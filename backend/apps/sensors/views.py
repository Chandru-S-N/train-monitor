from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Avg, Count, Max, Min
from django.utils import timezone
from datetime import timedelta
import django_filters
from .models import SensorData, GPSHistory
from .serializers import SensorDataSerializer, GPSHistorySerializer
from apps.trains.models import Train


class SensorDataFilter(django_filters.FilterSet):
    train_id = django_filters.CharFilter(field_name='train__id')
    status = django_filters.CharFilter()
    date_from = django_filters.DateTimeFilter(field_name='timestamp', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(field_name='timestamp', lookup_expr='lte')

    class Meta:
        model = SensorData
        fields = ['train_id', 'status']


class SensorDataListView(generics.ListCreateAPIView):
    serializer_class = SensorDataSerializer
    filterset_class = SensorDataFilter

    def get_queryset(self):
        return SensorData.objects.select_related('train').all()


class SensorLatestView(APIView):
    def get(self, request):
        result = []
        for train in Train.objects.filter(status='active'):
            latest = SensorData.objects.filter(train=train).order_by('-timestamp').first()
            if latest:
                result.append(SensorDataSerializer(latest).data)
        return Response(result)


class SensorStatsView(APIView):
    def get(self, request):
        now = timezone.now()
        last_hour = now - timedelta(hours=1)
        last_24h = now - timedelta(hours=24)

        qs_hour = SensorData.objects.filter(timestamp__gte=last_hour)
        qs_24h = SensorData.objects.filter(timestamp__gte=last_24h)

        stats = qs_hour.aggregate(
            avg_temperature=Avg('temperature'),
            avg_pressure=Avg('pressure'),
            avg_humidity=Avg('humidity'),
            avg_vibration=Avg('vibration'),
            total_readings=Count('id'),
        )

        from apps.alerts.models import Alert
        active_alerts = Alert.objects.filter(is_resolved=False).count()
        critical_alerts = Alert.objects.filter(is_resolved=False, severity='critical').count()

        return Response({
            'avg_temperature': round(stats['avg_temperature'] or 0, 1),
            'avg_pressure': round(stats['avg_pressure'] or 0, 1),
            'avg_humidity': round(stats['avg_humidity'] or 0, 1),
            'avg_vibration': round(stats['avg_vibration'] or 0, 2),
            'total_readings': stats['total_readings'] or 0,
            'total_readings_24h': qs_24h.count(),
            'active_trains': Train.objects.filter(status='active').count(),
            'total_trains': Train.objects.count(),
            'active_alerts': active_alerts,
            'critical_alerts': critical_alerts,
        })


class SensorChartDataView(APIView):
    """Return time-series data for charting.
    Supports both ?hours=N and custom ?from=ISO&to=ISO date ranges.
    """
    def get(self, request):
        train_id = request.query_params.get('train_id')
        sensor = request.query_params.get('sensor', 'temperature')

        valid_sensors = ['temperature', 'pressure', 'humidity', 'vibration', 'smoke', 'speed']
        if sensor not in valid_sensors:
            sensor = 'temperature'

        # Support custom from/to range OR hours-based range
        from_param = request.query_params.get('from')
        to_param   = request.query_params.get('to')

        if from_param and to_param:
            try:
                from dateutil.parser import parse as parse_dt
                from django.utils.timezone import make_aware, is_naive
                from_dt = parse_dt(from_param)
                to_dt   = parse_dt(to_param)
                if is_naive(from_dt):
                    from_dt = make_aware(from_dt)
                if is_naive(to_dt):
                    to_dt = make_aware(to_dt)
                qs = SensorData.objects.filter(timestamp__gte=from_dt, timestamp__lte=to_dt)
            except Exception:
                # Fallback to 1 hour
                qs = SensorData.objects.filter(timestamp__gte=timezone.now() - timedelta(hours=1))
        else:
            hours = int(request.query_params.get('hours', 1))
            cutoff = timezone.now() - timedelta(hours=hours)
            qs = SensorData.objects.filter(timestamp__gte=cutoff)

        if train_id:
            qs = qs.filter(train__id=train_id)
        qs = qs.order_by('timestamp')

        data = [
            {'timestamp': row.timestamp.isoformat(), 'value': getattr(row, sensor), 'train_id': row.train_id}
            for row in qs[:500]
        ]
        return Response(data)


class GPSHistoryView(APIView):
    def get(self, request, train_id):
        limit = int(request.query_params.get('limit', 200))
        history = GPSHistory.objects.filter(train_id=train_id).order_by('-timestamp')[:limit]
        return Response(GPSHistorySerializer(history, many=True).data)


class GPSLatestView(APIView):
    def get(self, request):
        result = []
        for train in Train.objects.all():
            latest = GPSHistory.objects.filter(train=train).first()
            if latest:
                result.append({
                    'train_id': train.id,
                    'train_name': train.name,
                    'route_name': train.route_name,
                    'status': train.status,
                    'latitude': latest.latitude,
                    'longitude': latest.longitude,
                    'speed': latest.speed,
                    'timestamp': latest.timestamp.isoformat(),
                })
        return Response(result)
