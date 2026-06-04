from django.urls import path
from . import views

urlpatterns = [
    path('latest/', views.GPSLatestView.as_view()),
    path('history/<str:train_id>/', views.GPSHistoryView.as_view()),
]
