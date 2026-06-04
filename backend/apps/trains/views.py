from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Train
from .serializers import TrainSerializer
from apps.users.permissions import IsAdminOrOperator, IsAdminRole

class TrainListCreateView(generics.ListCreateAPIView):
    serializer_class = TrainSerializer
    queryset = Train.objects.select_related('route').all()

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminOrOperator()]
        return [permissions.IsAuthenticated()]

class TrainDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TrainSerializer
    queryset = Train.objects.select_related('route').all()
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method == 'DELETE':
            return [IsAdminRole()]
        return [permissions.IsAuthenticated()]

    def update(self, request, *args, **kwargs):
        user = request.user
        if user.role in ['admin', 'operator']:
            return super().update(request, *args, **kwargs)
        elif user.role == 'maintenance':
            if request.method == 'PUT':
                raise PermissionDenied("Maintenance role cannot perform full updates (PUT). Use PATCH.")
            
            # Check keys being updated
            allowed_keys = {'status'}
            data_keys = set(request.data.keys())
            if not data_keys.issubset(allowed_keys):
                raise PermissionDenied("Maintenance role can only update 'status'.")
            
            return super().update(request, *args, **kwargs)
        else:
            raise PermissionDenied("You do not have permission to edit this train.")
