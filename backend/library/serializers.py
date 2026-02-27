from django.utils import timezone
from rest_framework import serializers

from .models import (
    Auteur,
    Categorie,
    Emprunt,
    Exemplaire,
    Livre,
    Notification,
    Penalite,
    ReglesBibliotheque,
    Reservation,
    Utilisateur,
)


class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = ["id", "nom"]


class AuteurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Auteur
        fields = ["id", "nom"]


class LivreSerializer(serializers.ModelSerializer):
    categorie = CategorieSerializer(read_only=True)
    auteurs = AuteurSerializer(many=True, read_only=True)
    nb_exemplaires_total = serializers.SerializerMethodField()
    nb_exemplaires_disponibles = serializers.SerializerMethodField()

    class Meta:
        model = Livre
        fields = [
            "id",
            "titre",
            "isbn",
            "categorie",
            "auteurs",
            "description",
            "image_url",
            "nb_exemplaires_total",
            "nb_exemplaires_disponibles",
        ]

    def get_nb_exemplaires_total(self, obj):
        return obj.exemplaires.count()

    def get_nb_exemplaires_disponibles(self, obj):
        return obj.exemplaires.filter(statut=Exemplaire.Statut.DISPONIBLE).count()


class LivreWriteSerializer(serializers.ModelSerializer):
    categorie_id = serializers.PrimaryKeyRelatedField(
        queryset=Categorie.objects.all(),
        source="categorie",
        allow_null=True,
        required=False,
    )
    auteurs_ids = serializers.PrimaryKeyRelatedField(
        queryset=Auteur.objects.all(),
        source="auteurs",
        many=True,
        required=False,
    )

    class Meta:
        model = Livre
        fields = [
            "id",
            "titre",
            "isbn",
            "categorie_id",
            "auteurs_ids",
            "description",
            "image_url",
        ]


class UtilisateurSerializer(serializers.ModelSerializer):
    nom_complet = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "email",
            "nom",
            "prenom",
            "role",
            "matricule",
            "is_active",
            "date_joined",
            "nom_complet",
        ]

    def get_nom_complet(self, obj):
        return obj.nom_complet


class ProfileUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Utilisateur
        fields = ["email", "nom", "prenom", "password"]

    def validate_email(self, value):
        if (
            Utilisateur.objects.filter(email__iexact=value)
            .exclude(pk=self.instance.pk if self.instance else None)
            .exists()
        ):
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Utilisateur
        fields = ["email", "nom", "prenom", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        return Utilisateur.objects.create_user(
            password=password,
            role=Utilisateur.Role.ADHERENT,
            **validated_data,
        )


class UtilisateurCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Utilisateur
        fields = ["email", "nom", "prenom", "role", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        return Utilisateur.objects.create_user(password=password, **validated_data)


class ExemplaireSerializer(serializers.ModelSerializer):
    livre = LivreSerializer(read_only=True)

    class Meta:
        model = Exemplaire
        fields = ["id", "livre", "code_barres", "statut", "localisation"]


class EmpruntSerializer(serializers.ModelSerializer):
    exemplaire = ExemplaireSerializer(read_only=True)
    adherent = UtilisateurSerializer(read_only=True)
    est_actif = serializers.SerializerMethodField()
    est_en_retard = serializers.SerializerMethodField()

    class Meta:
        model = Emprunt
        fields = [
            "id",
            "exemplaire",
            "adherent",
            "date_emprunt",
            "date_retour_prevue",
            "date_retour_effective",
            "est_actif",
            "est_en_retard",
        ]

    def get_est_actif(self, obj):
        return obj.date_retour_effective is None

    def get_est_en_retard(self, obj):
        if obj.date_retour_effective is not None:
            return False
        return obj.date_retour_prevue < timezone.localdate()


class ReservationSerializer(serializers.ModelSerializer):
    livre = LivreSerializer(read_only=True)
    adherent = UtilisateurSerializer(read_only=True)
    exemplaire = ExemplaireSerializer(read_only=True)

    class Meta:
        model = Reservation
        fields = [
            "id",
            "livre",
            "adherent",
            "statut",
            "created_at",
            "exemplaire",
            "expires_at",
            "date_retour_prevue",
        ]


class PenaliteSerializer(serializers.ModelSerializer):
    adherent = UtilisateurSerializer(read_only=True)
    emprunt = EmpruntSerializer(read_only=True)

    class Meta:
        model = Penalite
        fields = [
            "id",
            "adherent",
            "emprunt",
            "jours_retard",
            "taux_par_jour",
            "montant",
            "statut",
            "created_at",
            "paid_at",
        ]


class ReglesBibliothequeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReglesBibliotheque
        fields = [
            "id",
            "quota_adherent",
            "quota_bibliothecaire",
            "quota_admin",
            "duree_adherent_jours",
            "duree_bibliothecaire_jours",
            "duree_admin_jours",
            "penalite_par_jour",
            "delai_retrait_reservation_jours",
            "seuil_blocage_penalites",
        ]
        read_only_fields = ["id"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "type",
            "created_at",
            "read_at",
        ]
