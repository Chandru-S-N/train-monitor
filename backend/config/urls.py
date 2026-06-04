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

def setup_admin(request):
    from django.contrib.auth import get_user_model
    from django.http import HttpResponse
    User = get_user_model()
    if not User.objects.filter(is_superuser=True).exists():
        User.objects.create_superuser('admin', 'admin@trainmonitor.com', 'admin123')
        return HttpResponse("Admin created successfully! Username: admin, Password: admin123. Please log in to /admin and change this password.")
    return HttpResponse("Admin already exists.")

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
    path('api/setup-admin/', setup_admin, name='setup_admin'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
