from django.urls import path
from .views import MaintenanceLogListCreateView, MaintenanceLogDetailView, MaintenanceStatsView

urlpatterns = [
    path('', MaintenanceLogListCreateView.as_view(), name='maintenance-list'),
    path('stats/', MaintenanceStatsView.as_view(), name='maintenance-stats'),
    path('<uuid:pk>/', MaintenanceLogDetailView.as_view(), name='maintenance-detail'),
]
