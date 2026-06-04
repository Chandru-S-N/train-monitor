from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """Only admin users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrOperator(BasePermission):
    """Admin or operator users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'operator']


class IsAdminOrReadOnly(BasePermission):
    """Anyone authenticated can read; only admin can write."""
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role == 'admin'


class IsMaintenance(BasePermission):
    """Only maintenance staff."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'maintenance'


class IsMaintenanceOrAbove(BasePermission):
    """Maintenance staff, operators, and admins (all roles)."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'operator', 'maintenance']


class IsAdminOrMaintenance(BasePermission):
    """Admin or maintenance (not operator)."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'maintenance']
