from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Auteur, Categorie, Emprunt, Exemplaire, Livre, Penalite, ReglesBibliotheque, Reservation, Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    model = Utilisateur
    list_display = ("email", "nom", "prenom", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    ordering = ("email",)
    search_fields = ("email", "nom", "prenom", "matricule")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profil", {"fields": ("nom", "prenom", "role", "matricule")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "nom", "prenom", "role", "matricule", "password1", "password2")}),
    )
    filter_horizontal = ("groups", "user_permissions")


admin.site.register(Categorie)
admin.site.register(Auteur)
admin.site.register(Livre)
admin.site.register(Exemplaire)
admin.site.register(Emprunt)
admin.site.register(Reservation)
admin.site.register(Penalite)
admin.site.register(ReglesBibliotheque)