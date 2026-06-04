from django.urls import path
from . import views

urlpatterns = [
    path('', views.TrainListCreateView.as_view()),
    path('<str:id>/', views.TrainDetailView.as_view()),
]
