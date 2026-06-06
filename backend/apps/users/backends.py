from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

class EmailOrUsernameModelBackend(ModelBackend):
    """
    Custom authentication backend allowing users to log in using either
    their username or email address.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        User = get_user_model()
        
        # SimpleJWT or standard login might pass the identifier in 'username' or 'email'
        login_id = username or kwargs.get('email') or kwargs.get(User.USERNAME_FIELD)
        
        if not login_id:
            return None

        try:
            # Look up user by username or email (case-insensitive)
            user = User.objects.get(Q(username__iexact=login_id) | Q(email__iexact=login_id))
        except User.DoesNotExist:
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
