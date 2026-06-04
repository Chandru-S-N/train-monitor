from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        "name": "Smart Train Monitoring System API Gateway",
        "status": "online",
        "version": "1.0.0",
        "admin_console": "/admin/",
        "frontend_app": "http://localhost:5173/"
    })

urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/trains/', include('apps.trains.urls')),
    path('api/sensors/', include('apps.sensors.urls')),
    path('api/gps/', include('apps.sensors.gps_urls')),
    path('api/alerts/', include('apps.alerts.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/maintenance/', include('apps.maintenance.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
