from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Avg, Count, Max, Min, OuterRef, Subquery
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
    """
    Return the single most-recent SensorData row per active train
    using a single subquery instead of N separate DB hits.
    """
    def get(self, request):
        # One subquery: latest timestamp per train
        latest_ids = (
            SensorData.objects
            .filter(train=OuterRef('train'))
            .order_by('-timestamp')
            .values('id')[:1]
        )
        qs = (
            SensorData.objects
            .select_related('train')
            .filter(train__status='active', id=Subquery(latest_ids))
        )
        return Response(SensorDataSerializer(qs, many=True).data)


class SensorStatsView(APIView):
    def get(self, request):
        now = timezone.now()
        last_hour = now - timedelta(hours=1)
        last_24h = now - timedelta(hours=24)

        # Single aggregation query for all sensor averages
        stats = SensorData.objects.filter(timestamp__gte=last_hour).aggregate(
            avg_temperature=Avg('temperature'),
            avg_pressure=Avg('pressure'),
            avg_humidity=Avg('humidity'),
            avg_vibration=Avg('vibration'),
            total_readings=Count('id'),
        )

        total_readings_24h = SensorData.objects.filter(timestamp__gte=last_24h).count()

        from apps.alerts.models import Alert
        # Single aggregation for alert counts instead of 2 separate queries
        from django.db.models import Q, Sum, Case, When, IntegerField
        alert_agg = Alert.objects.filter(is_resolved=False).aggregate(
            total_active=Count('id'),
            critical=Count(Case(When(severity='critical', then=1), output_field=IntegerField())),
        )

        train_counts = Train.objects.aggregate(
            active=Count(Case(When(status='active', then=1), output_field=IntegerField())),
            total=Count('id'),
        )

        return Response({
            'avg_temperature': round(stats['avg_temperature'] or 0, 1),
            'avg_pressure': round(stats['avg_pressure'] or 0, 1),
            'avg_humidity': round(stats['avg_humidity'] or 0, 1),
            'avg_vibration': round(stats['avg_vibration'] or 0, 2),
            'total_readings': stats['total_readings'] or 0,
            'total_readings_24h': total_readings_24h,
            'active_trains': train_counts['active'] or 0,
            'total_trains': train_counts['total'] or 0,
            'active_alerts': alert_agg['total_active'] or 0,
            'critical_alerts': alert_agg['critical'] or 0,
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
                qs = SensorData.objects.filter(timestamp__gte=timezone.now() - timedelta(hours=1))
        else:
            hours = int(request.query_params.get('hours', 1))
            cutoff = timezone.now() - timedelta(hours=hours)
            qs = SensorData.objects.filter(timestamp__gte=cutoff)

        if train_id:
            qs = qs.filter(train__id=train_id)

        # Only fetch the two columns we need — much faster than full model
        qs = qs.order_by('timestamp').values('timestamp', sensor, 'train_id')

        data = [
            {'timestamp': row['timestamp'].isoformat(), 'value': row[sensor], 'train_id': row['train_id']}
            for row in qs[:500]
        ]
        return Response(data)


class GPSHistoryView(APIView):
    def get(self, request, train_id):
        limit = int(request.query_params.get('limit', 200))
        history = GPSHistory.objects.filter(train_id=train_id).order_by('-timestamp')[:limit]
        return Response(GPSHistorySerializer(history, many=True).data)


class GPSLatestView(APIView):
    """
    Return the most recent GPS fix per train using a single subquery.
    Avoids N individual queries (one per train).
    """
    def get(self, request):
        # Subquery: latest GPS row id per train
        latest_gps_ids = (
            GPSHistory.objects
            .filter(train=OuterRef('pk'))
            .order_by('-timestamp')
            .values('id')[:1]
        )
        trains = Train.objects.annotate(
            latest_gps_id=Subquery(latest_gps_ids)
        ).filter(latest_gps_id__isnull=False).values(
            'id', 'name', 'route_name', 'status', 'latest_gps_id'
        )

        gps_map = {
            g.train_id: g
            for g in GPSHistory.objects.filter(
                id__in=[t['latest_gps_id'] for t in trains]
            )
        }

        result = []
        for train in trains:
            gps = gps_map.get(train['id'])
            if gps:
                result.append({
                    'train_id': train['id'],
                    'train_name': train['name'],
                    'route_name': train['route_name'],
                    'status': train['status'],
                    'latitude': gps.latitude,
                    'longitude': gps.longitude,
                    'speed': gps.speed,
                    'timestamp': gps.timestamp.isoformat(),
                })

        return Response(result)
