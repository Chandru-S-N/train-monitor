from django.urls import path
from . import views

urlpatterns = [
    path('generate/', views.GenerateReportView.as_view(), name='generate_report'),
]
