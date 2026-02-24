from rest_framework.permissions import BasePermission


class IsStaff(BasePermission):
    message = "Staff only"

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("BIBLIOTHECAIRE", "ADMIN")
        )


class IsAdmin(BasePermission):
    message = "Admin only"

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )
