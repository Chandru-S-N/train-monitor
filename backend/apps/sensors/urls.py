from django.urls import path
from . import views

urlpatterns = [
    path('', views.SensorDataListView.as_view()),
    path('latest/', views.SensorLatestView.as_view()),
    path('stats/', views.SensorStatsView.as_view()),
    path('chart/', views.SensorChartDataView.as_view()),
]
