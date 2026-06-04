from django.urls import path
from . import views

urlpatterns = [
    path('', views.AlertListView.as_view()),
    path('stats/', views.AlertStatsView.as_view()),
    path('<uuid:pk>/acknowledge/', views.AlertAcknowledgeView.as_view()),
    path('<uuid:pk>/resolve/', views.AlertResolveView.as_view()),
]
