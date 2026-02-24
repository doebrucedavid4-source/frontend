from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UtilisateurManager(BaseUserManager):
    def _matricule_prefix(self, role: str) -> str:
        if role == Utilisateur.Role.ADMIN:
            return "ADM"
        if role == Utilisateur.Role.BIBLIOTHECAIRE:
            return "BIB"
        return "ADH"

    def _generate_matricule(self, role: str, user_id: int) -> str:
        prefix = self._matricule_prefix(role)
        return f"{prefix}-{user_id:05d}"

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        if not user.matricule:
            user.matricule = self._generate_matricule(user.role, user.id)
            user.save(update_fields=["matricule"])
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", Utilisateur.Role.ADMIN)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class Utilisateur(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        BIBLIOTHECAIRE = "BIBLIOTHECAIRE", "Bibliothécaire"
        ADMIN = "ADMIN", "Admin"
        ADHERENT = "ADHERENT", "Adhérent"

    email = models.EmailField(unique=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ADHERENT)
    matricule = models.CharField(max_length=50, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UtilisateurManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nom", "prenom"]

    @property
    def nom_complet(self) -> str:
        return f"{self.prenom} {self.nom}".strip()

    def save(self, *args, **kwargs):
        if self.role in (Utilisateur.Role.BIBLIOTHECAIRE, Utilisateur.Role.ADMIN):
            self.is_staff = True
        else:
            self.is_staff = False
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.email} ({self.nom_complet})"


class Categorie(models.Model):
    nom = models.CharField(max_length=120, unique=True)

    def __str__(self) -> str:
        return self.nom


class Auteur(models.Model):
    nom = models.CharField(max_length=120)

    def __str__(self) -> str:
        return self.nom


class Livre(models.Model):
    titre = models.CharField(max_length=200)
    isbn = models.CharField(max_length=32, blank=True, null=True)
    categorie = models.ForeignKey(Categorie, on_delete=models.SET_NULL, null=True, blank=True)
    auteurs = models.ManyToManyField(Auteur, blank=True)
    description = models.TextField(blank=True)
    image_url = models.URLField(blank=True)

    def __str__(self) -> str:
        return self.titre


class Exemplaire(models.Model):
    class Statut(models.TextChoices):
        DISPONIBLE = "DISPONIBLE", "Disponible"
        EMPRUNTE = "EMPRUNTE", "Emprunte"
        EN_RESERVATION = "EN_RESERVATION", "En reservation"
        PERDU = "PERDU", "Perdu"
        HS = "HS", "Hors service"

    livre = models.ForeignKey(Livre, related_name="exemplaires", on_delete=models.CASCADE)
    code_barres = models.CharField(max_length=64, unique=True)
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.DISPONIBLE)
    localisation = models.CharField(max_length=120, default="Rayon")

    def __str__(self) -> str:
        return f"{self.code_barres} - {self.livre.titre}"


class Emprunt(models.Model):
    exemplaire = models.ForeignKey(Exemplaire, on_delete=models.PROTECT)
    adherent = models.ForeignKey(Utilisateur, on_delete=models.PROTECT)
    date_emprunt = models.DateField(default=timezone.now)
    date_retour_prevue = models.DateField()
    date_retour_effective = models.DateField(blank=True, null=True)

    class Meta:
        ordering = ["-date_emprunt"]


class Reservation(models.Model):
    class Statut(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        PRETE_A_RETIRER = "PRETE_A_RETIRER", "Prete a retirer"
        ANNULEE = "ANNULEE", "Annulee"
        EXPIREE = "EXPIREE", "Expiree"
        HONOREE = "HONOREE", "Honoree"

    livre = models.ForeignKey(Livre, on_delete=models.PROTECT)
    adherent = models.ForeignKey(Utilisateur, on_delete=models.PROTECT)
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.EN_ATTENTE)
    created_at = models.DateTimeField(auto_now_add=True)
    exemplaire = models.ForeignKey(Exemplaire, on_delete=models.SET_NULL, blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    date_retour_prevue = models.DateField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]


class Penalite(models.Model):
    class Statut(models.TextChoices):
        IMPAYEE = "IMPAYEE", "Impayee"
        PAYEE = "PAYEE", "Payee"

    adherent = models.ForeignKey(Utilisateur, on_delete=models.PROTECT)
    emprunt = models.ForeignKey(Emprunt, on_delete=models.PROTECT)
    jours_retard = models.IntegerField(default=0)
    taux_par_jour = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    montant = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    statut = models.CharField(max_length=10, choices=Statut.choices, default=Statut.IMPAYEE)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]


class ReglesBibliotheque(models.Model):
    quota_adherent = models.PositiveIntegerField(default=2)
    quota_bibliothecaire = models.PositiveIntegerField(default=3)
    quota_admin = models.PositiveIntegerField(default=5)
    duree_adherent_jours = models.PositiveIntegerField(default=14)
    duree_bibliothecaire_jours = models.PositiveIntegerField(default=14)
    duree_admin_jours = models.PositiveIntegerField(default=30)
    penalite_par_jour = models.DecimalField(max_digits=8, decimal_places=2, default=1)
    delai_retrait_reservation_jours = models.PositiveIntegerField(default=3)
    seuil_blocage_penalites = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self) -> str:
        return "Regles Bibliotheque"
