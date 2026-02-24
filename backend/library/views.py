from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import authenticate, login, logout
from django.db import transaction
from django.db.models import Q, Sum
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status, viewsets
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Auteur,
    Categorie,
    Emprunt,
    Exemplaire,
    Livre,
    Penalite,
    ReglesBibliotheque,
    Reservation,
    Utilisateur,
)
from .permissions import IsAdmin, IsStaff
from .serializers import (
    AuteurSerializer,
    CategorieSerializer,
    EmpruntSerializer,
    LivreSerializer,
    LivreWriteSerializer,
    PenaliteSerializer,
    RegistrationSerializer,
    ReservationSerializer,
    ReglesBibliothequeSerializer,
    ProfileUpdateSerializer,
    UtilisateurCreateSerializer,
    UtilisateurSerializer,
)


def get_rules() -> ReglesBibliotheque:
    rules = ReglesBibliotheque.objects.first()
    if not rules:
        rules = ReglesBibliotheque.objects.create()
    return rules


def generate_code_barres(livre: Livre) -> str:
    count = livre.exemplaires.count() + 1
    return f"EX-{livre.id:04d}-{count}"


def expire_reservations() -> None:
    now = timezone.now()
    expired = Reservation.objects.filter(
        statut=Reservation.Statut.PRETE_A_RETIRER,
        expires_at__isnull=False,
        expires_at__lt=now,
    ).select_related("exemplaire")
    for reservation in expired:
        if reservation.exemplaire and reservation.exemplaire.statut == Exemplaire.Statut.EN_RESERVATION:
            reservation.exemplaire.statut = Exemplaire.Statut.DISPONIBLE
            reservation.exemplaire.save(update_fields=["statut"])
        reservation.statut = Reservation.Statut.EXPIREE
        reservation.save(update_fields=["statut"])


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [SessionAuthentication]

    def get(self, request):
        return Response({"detail": "ok"})


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [SessionAuthentication]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        if not email or not password:
            return Response({"detail": "Email et mot de passe requis."}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, email=email, password=password)
        if not user:
            return Response({"detail": "Identifiants invalides."}, status=status.HTTP_401_UNAUTHORIZED)

        login(request, user)
        return Response({"detail": "ok"})


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"detail": "ok"})


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [SessionAuthentication]

    def post(self, request):
        payload = {
            "prenom": request.data.get("prenom"),
            "nom": request.data.get("nom"),
            "email": request.data.get("email"),
            "password": request.data.get("password"),
        }
        serializer = RegistrationSerializer(data=payload)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response({"detail": "ok"}, status=status.HTTP_201_CREATED)


class PublicStatsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        total_livres = Livre.objects.count()
        total_adherents = Utilisateur.objects.filter(role=Utilisateur.Role.ADHERENT).count()
        date_30 = timezone.localdate() - timedelta(days=30)
        emprunts_30j = Emprunt.objects.filter(date_emprunt__gte=date_30).count()
        total_exemplaires = Exemplaire.objects.count()
        dispo = Exemplaire.objects.filter(statut=Exemplaire.Statut.DISPONIBLE).count()
        disponibilite_pct = (dispo / total_exemplaires * 100) if total_exemplaires else 0
        return Response(
            {
                "total_livres": total_livres,
                "total_adherents": total_adherents,
                "emprunts_30j": emprunts_30j,
                "disponibilite_pct": round(disponibilite_pct, 1),
            }
        )


class AdminReglesView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        rules = get_rules()
        return Response(ReglesBibliothequeSerializer(rules).data)

    def patch(self, request):
        rules = get_rules()
        serializer = ReglesBibliothequeSerializer(rules, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


class LivreViewSet(viewsets.ModelViewSet):
    queryset = Livre.objects.all().prefetch_related("auteurs", "exemplaires").select_related("categorie")

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return LivreWriteSerializer
        return LivreSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsStaff()]

    def get_queryset(self):
        qs = Livre.objects.all().prefetch_related("auteurs", "exemplaires").select_related("categorie")
        q = self.request.query_params.get("q")
        categorie = self.request.query_params.get("categorie")
        if q:
            qs = qs.filter(
                Q(titre__icontains=q)
                | Q(isbn__icontains=q)
                | Q(auteurs__nom__icontains=q)
            ).distinct()
        if categorie:
            qs = qs.filter(categorie_id=categorie)
        return qs

    def perform_create(self, serializer):
        livre = serializer.save()
        if livre.exemplaires.count() == 0:
            Exemplaire.objects.create(
                livre=livre,
                code_barres=generate_code_barres(livre),
                localisation="Rayon",
            )


class CategorieViewSet(viewsets.ModelViewSet):
    queryset = Categorie.objects.all().order_by("nom")
    serializer_class = CategorieSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsStaff()]


class AuteurViewSet(viewsets.ModelViewSet):
    queryset = Auteur.objects.all().order_by("nom")
    serializer_class = AuteurSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsStaff()]


class ReservationCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        livre_id = request.data.get("livre")
        if not livre_id:
            return Response({"detail": "Livre requis."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            livre = Livre.objects.get(id=livre_id)
        except Livre.DoesNotExist:
            return Response({"detail": "Livre introuvable."}, status=status.HTTP_404_NOT_FOUND)
        reservation = Reservation.objects.create(livre=livre, adherent=request.user)
        return Response(ReservationSerializer(reservation).data, status=status.HTTP_201_CREATED)


class StaffDashboardView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        expire_reservations()
        emprunts_actifs = Emprunt.objects.filter(date_retour_effective__isnull=True)
        retards = emprunts_actifs.filter(date_retour_prevue__lt=timezone.localdate())
        reservations_en_attente = Reservation.objects.filter(statut=Reservation.Statut.EN_ATTENTE).count()
        reservations_pretes = Reservation.objects.filter(statut=Reservation.Statut.PRETE_A_RETIRER).count()
        penalites_impayees = Penalite.objects.filter(statut=Penalite.Statut.IMPAYEE)
        montant_impaye = penalites_impayees.aggregate(total=Sum("montant"))["total"] or Decimal("0")
        total_livres = Livre.objects.count()
        total_adherents = Utilisateur.objects.filter(role=Utilisateur.Role.ADHERENT).count()
        return Response(
            {
                "emprunts_actifs": emprunts_actifs.count(),
                "reservations_en_attente": reservations_en_attente,
                "reservations_pretes": reservations_pretes,
                "penalites_impayees": penalites_impayees.count(),
                "montant_impaye": float(montant_impaye),
                "retards": EmpruntSerializer(retards, many=True).data,
                "total_livres": total_livres,
                "total_adherents": total_adherents,
            }
        )


class StaffEmpruntsView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        emprunts = Emprunt.objects.select_related("exemplaire", "adherent", "exemplaire__livre")
        return Response(EmpruntSerializer(emprunts, many=True).data)


class StaffEmpruntCreateView(APIView):
    permission_classes = [IsStaff]

    @transaction.atomic
    def post(self, request):
        code_barres = request.data.get("code_barres")
        adherent_id = request.data.get("adherent_id")
        if not code_barres or not adherent_id:
            return Response({"detail": "Code-barres et adhérent requis."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            exemplaire = Exemplaire.objects.select_for_update().get(code_barres=code_barres)
        except Exemplaire.DoesNotExist:
            return Response({"detail": "Exemplaire introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if exemplaire.statut != Exemplaire.Statut.DISPONIBLE:
            return Response({"detail": "Exemplaire indisponible."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            adherent = Utilisateur.objects.get(id=adherent_id)
        except Utilisateur.DoesNotExist:
            return Response({"detail": "Adhérent introuvable."}, status=status.HTTP_404_NOT_FOUND)

        rules = get_rules()
        if adherent.role == Utilisateur.Role.ADMIN:
            quota = rules.quota_admin
            duree = rules.duree_admin_jours
        elif adherent.role == Utilisateur.Role.BIBLIOTHECAIRE:
            quota = rules.quota_bibliothecaire
            duree = rules.duree_bibliothecaire_jours
        else:
            quota = rules.quota_adherent
            duree = rules.duree_adherent_jours

        actifs = Emprunt.objects.filter(adherent=adherent, date_retour_effective__isnull=True).count()
        if actifs >= quota:
            return Response({"detail": "Quota d'emprunts atteint."}, status=status.HTTP_400_BAD_REQUEST)

        impayees = Penalite.objects.filter(adherent=adherent, statut=Penalite.Statut.IMPAYEE)
        montant = impayees.aggregate(total=Sum("montant"))["total"] or Decimal("0")
        if montant > rules.seuil_blocage_penalites:
            return Response({"detail": "Adhérent bloqué par pénalités impayées."}, status=status.HTTP_400_BAD_REQUEST)

        date_emprunt = timezone.localdate()
        date_retour_prevue = date_emprunt + timedelta(days=duree)
        emprunt = Emprunt.objects.create(
            exemplaire=exemplaire,
            adherent=adherent,
            date_emprunt=date_emprunt,
            date_retour_prevue=date_retour_prevue,
        )
        exemplaire.statut = Exemplaire.Statut.EMPRUNTE
        exemplaire.save(update_fields=["statut"])
        return Response(EmpruntSerializer(emprunt).data, status=status.HTTP_201_CREATED)


class StaffRetourView(APIView):
    permission_classes = [IsStaff]

    @transaction.atomic
    def post(self, request):
        code_barres = request.data.get("code_barres")
        if not code_barres:
            return Response({"detail": "Code-barres requis."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            exemplaire = Exemplaire.objects.select_for_update().get(code_barres=code_barres)
        except Exemplaire.DoesNotExist:
            return Response({"detail": "Exemplaire introuvable."}, status=status.HTTP_404_NOT_FOUND)

        emprunt = Emprunt.objects.filter(exemplaire=exemplaire, date_retour_effective__isnull=True).first()
        if not emprunt:
            return Response({"detail": "Aucun emprunt actif pour cet exemplaire."}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.localdate()
        emprunt.date_retour_effective = today
        emprunt.save(update_fields=["date_retour_effective"])

        exemplaire.statut = Exemplaire.Statut.DISPONIBLE
        exemplaire.save(update_fields=["statut"])

        if today > emprunt.date_retour_prevue:
            days = (today - emprunt.date_retour_prevue).days
            rules = get_rules()
            if not Penalite.objects.filter(emprunt=emprunt).exists():
                Penalite.objects.create(
                    adherent=emprunt.adherent,
                    emprunt=emprunt,
                    jours_retard=days,
                    taux_par_jour=rules.penalite_par_jour,
                    montant=Decimal(days) * rules.penalite_par_jour,
                )

        return Response({"detail": "ok"})


class StaffAdherentsView(APIView):
    def get_permissions(self):
        if self.request.method.upper() == "POST":
            return [IsAdmin()]
        return [IsStaff()]

    def get(self, request):
        adherents = Utilisateur.objects.all().order_by("nom", "prenom")
        if request.user.role == Utilisateur.Role.BIBLIOTHECAIRE:
            adherents = adherents.filter(role=Utilisateur.Role.ADHERENT)
        return Response(UtilisateurSerializer(adherents, many=True).data)

    def post(self, request):
        serializer = UtilisateurCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        return Response(UtilisateurSerializer(user).data, status=status.HTTP_201_CREATED)


class StaffAdherentDetailView(APIView):
    def get_permissions(self):
        return [IsAdmin()]

    def patch(self, request, pk: int):
        try:
            user = Utilisateur.objects.get(pk=pk)
        except Utilisateur.DoesNotExist:
            return Response({"detail": "Adherent introuvable."}, status=status.HTTP_404_NOT_FOUND)
        data = request.data
        for field in ["nom", "prenom", "email", "role", "is_active"]:
            if field in data:
                setattr(user, field, data.get(field))
        user.save()
        return Response(UtilisateurSerializer(user).data)


class StaffReservationsView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        expire_reservations()
        reservations = Reservation.objects.select_related("livre", "adherent", "exemplaire", "exemplaire__livre")
        return Response(ReservationSerializer(reservations, many=True).data)


class StaffReservationApprouverView(APIView):
    permission_classes = [IsStaff]

    @transaction.atomic
    def post(self, request, pk: int):
        try:
            reservation = Reservation.objects.select_for_update().get(pk=pk)
        except Reservation.DoesNotExist:
            return Response({"detail": "Reservation introuvable."}, status=status.HTTP_404_NOT_FOUND)
        if reservation.statut != Reservation.Statut.EN_ATTENTE:
            return Response({"detail": "Reservation deja traitee."}, status=status.HTTP_400_BAD_REQUEST)

        date_retour_str = request.data.get("date_retour_prevue")
        date_retour = parse_date(date_retour_str) if date_retour_str else None
        if not date_retour:
            return Response({"detail": "Date de retour requise."}, status=status.HTTP_400_BAD_REQUEST)
        if date_retour <= timezone.localdate():
            return Response({"detail": "Date de retour invalide."}, status=status.HTTP_400_BAD_REQUEST)

        exemplaire = Exemplaire.objects.select_for_update().filter(
            livre=reservation.livre, statut=Exemplaire.Statut.DISPONIBLE
        ).first()
        if not exemplaire:
            return Response({"detail": "Aucun exemplaire disponible."}, status=status.HTTP_400_BAD_REQUEST)

        rules = get_rules()
        reservation.statut = Reservation.Statut.PRETE_A_RETIRER
        reservation.exemplaire = exemplaire
        reservation.expires_at = timezone.now() + timedelta(days=rules.delai_retrait_reservation_jours)
        reservation.date_retour_prevue = date_retour
        reservation.save()

        exemplaire.statut = Exemplaire.Statut.EN_RESERVATION
        exemplaire.save(update_fields=["statut"])

        return Response(ReservationSerializer(reservation).data)


class StaffReservationAnnulerView(APIView):
    permission_classes = [IsStaff]

    @transaction.atomic
    def post(self, request, pk: int):
        try:
            reservation = Reservation.objects.select_for_update().get(pk=pk)
        except Reservation.DoesNotExist:
            return Response({"detail": "Reservation introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if reservation.exemplaire and reservation.exemplaire.statut == Exemplaire.Statut.EN_RESERVATION:
            reservation.exemplaire.statut = Exemplaire.Statut.DISPONIBLE
            reservation.exemplaire.save(update_fields=["statut"])

        reservation.statut = Reservation.Statut.ANNULEE
        reservation.save(update_fields=["statut"])
        return Response(ReservationSerializer(reservation).data)


class StaffPenalitesView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        penalites = Penalite.objects.select_related(
            "adherent", "emprunt", "emprunt__exemplaire", "emprunt__exemplaire__livre"
        )
        return Response(PenaliteSerializer(penalites, many=True).data)


class StaffPenalitePayerView(APIView):
    permission_classes = [IsStaff]

    def post(self, request, pk: int):
        try:
            penalite = Penalite.objects.get(pk=pk)
        except Penalite.DoesNotExist:
            return Response({"detail": "Penalite introuvable."}, status=status.HTTP_404_NOT_FOUND)
        penalite.statut = Penalite.Statut.PAYEE
        penalite.paid_at = timezone.now()
        penalite.save(update_fields=["statut", "paid_at"])
        return Response(PenaliteSerializer(penalite).data)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UtilisateurSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()
        return Response(UtilisateurSerializer(user).data)


class MeEmpruntsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        emprunts = Emprunt.objects.filter(adherent=request.user).select_related("exemplaire", "exemplaire__livre")
        return Response(EmpruntSerializer(emprunts, many=True).data)


class MeEmpruntCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        if request.user.role != Utilisateur.Role.ADHERENT:
            return Response({"detail": "Accès interdit."}, status=status.HTTP_403_FORBIDDEN)

        livre_id = request.data.get("livre")
        if not livre_id:
            return Response({"detail": "Livre requis."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            livre = Livre.objects.get(id=livre_id)
        except Livre.DoesNotExist:
            return Response({"detail": "Livre introuvable."}, status=status.HTTP_404_NOT_FOUND)

        exemplaire = (
            Exemplaire.objects.select_for_update()
            .filter(livre=livre, statut=Exemplaire.Statut.DISPONIBLE)
            .first()
        )
        if not exemplaire:
            return Response({"detail": "Aucun exemplaire disponible."}, status=status.HTTP_400_BAD_REQUEST)

        rules = get_rules()
        actifs = Emprunt.objects.filter(adherent=request.user, date_retour_effective__isnull=True).count()
        if actifs >= rules.quota_adherent:
            return Response({"detail": "Quota d'emprunts atteint."}, status=status.HTTP_400_BAD_REQUEST)

        impayees = Penalite.objects.filter(adherent=request.user, statut=Penalite.Statut.IMPAYEE)
        montant = impayees.aggregate(total=Sum("montant"))["total"] or Decimal("0")
        if montant > rules.seuil_blocage_penalites:
            return Response({"detail": "Adhérent bloqué par pénalités impayées."}, status=status.HTTP_400_BAD_REQUEST)

        date_emprunt = timezone.localdate()
        date_retour_prevue = date_emprunt + timedelta(days=rules.duree_adherent_jours)
        emprunt = Emprunt.objects.create(
            exemplaire=exemplaire,
            adherent=request.user,
            date_emprunt=date_emprunt,
            date_retour_prevue=date_retour_prevue,
        )
        exemplaire.statut = Exemplaire.Statut.EMPRUNTE
        exemplaire.save(update_fields=["statut"])
        return Response(EmpruntSerializer(emprunt).data, status=status.HTTP_201_CREATED)


class MeReservationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        expire_reservations()
        reservations = Reservation.objects.filter(adherent=request.user).select_related("livre", "exemplaire")
        return Response(ReservationSerializer(reservations, many=True).data)


class MePenalitesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        penalites = Penalite.objects.filter(adherent=request.user).select_related(
            "emprunt", "emprunt__exemplaire", "emprunt__exemplaire__livre"
        )
        return Response(PenaliteSerializer(penalites, many=True).data)


class MeNotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response([])
