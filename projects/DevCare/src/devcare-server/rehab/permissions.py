from rest_framework import permissions

class IsDoctor(permissions.BasePermission):
    """
    Allows access only to users with the 'doctor' role.
    """
    message = "Only doctor users can create rehab plans."

    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            getattr(request.user, 'role', None) == 'doctor'
        )
