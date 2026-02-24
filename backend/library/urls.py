from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AuteurViewSet,
    AdminReglesView,
    CategorieViewSet,
    CsrfView,
    LivreViewSet,
    LoginView,
    LogoutView,
    MeEmpruntsView,
    MeEmpruntCreateView,
    MeNotificationsView,
    MePenalitesView,
    MeReservationsView,
    MeView,
    PublicStatsView,
    RegisterView,
    ReservationCreateView,
    StaffAdherentDetailView,
    StaffAdherentsView,
    StaffDashboardView,
    StaffEmpruntCreateView,
    StaffEmpruntsView,
    StaffPenalitePayerView,
    StaffPenalitesView,
    StaffReservationAnnulerView,
    StaffReservationApprouverView,
    StaffReservationsView,
    StaffRetourView,
)

router = DefaultRouter()
router.register(r"books", LivreViewSet, basename="books")
router.register(r"categories", CategorieViewSet, basename="categories")
router.register(r"authors", AuteurViewSet, basename="authors")

urlpatterns = [
    path("auth/csrf/", CsrfView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path("auth/logout/", LogoutView.as_view()),
    path("auth/register/", RegisterView.as_view()),
    path("public/stats/", PublicStatsView.as_view()),
    path("admin/regles/", AdminReglesView.as_view()),
    path("reservations/", ReservationCreateView.as_view()),
    path("staff/dashboard/", StaffDashboardView.as_view()),
    path("staff/emprunts/", StaffEmpruntsView.as_view()),
    path("staff/emprunts/nouveau/", StaffEmpruntCreateView.as_view()),
    path("staff/retours/", StaffRetourView.as_view()),
    path("staff/adherents/", StaffAdherentsView.as_view()),
    path("staff/adherents/<int:pk>/", StaffAdherentDetailView.as_view()),
    path("staff/reservations/", StaffReservationsView.as_view()),
    path("staff/reservations/<int:pk>/annuler/", StaffReservationAnnulerView.as_view()),
    path("staff/reservations/<int:pk>/approuver/", StaffReservationApprouverView.as_view()),
    path("staff/penalites/", StaffPenalitesView.as_view()),
    path("staff/penalites/<int:pk>/payer/", StaffPenalitePayerView.as_view()),
    path("me/", MeView.as_view()),
    path("me/emprunts/", MeEmpruntsView.as_view()),
    path("me/emprunts/nouveau/", MeEmpruntCreateView.as_view()),
    path("me/reservations/", MeReservationsView.as_view()),
    path("me/penalites/", MePenalitesView.as_view()),
    path("me/notifications/", MeNotificationsView.as_view()),
    path("", include(router.urls)),
]
