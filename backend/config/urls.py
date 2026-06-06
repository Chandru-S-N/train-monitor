from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def handler404(request, exception=None):
    return JsonResponse({'error': 'Not found', 'status': 404}, status=404)


def handler500(request):
    return JsonResponse({'error': 'Internal server error', 'status': 500}, status=500)

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
    user, created = User.objects.get_or_create(
        email='admin@trainmonitor.com',
        defaults={'username': 'admin', 'is_staff': True, 'is_superuser': True}
    )
    user.set_password('Admin@123')
    user.is_staff = True
    user.is_superuser = True
    user.save()
    return HttpResponse("Admin setup/reset complete! Username: admin, Email: admin@trainmonitor.com, Password: Admin@123")

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
