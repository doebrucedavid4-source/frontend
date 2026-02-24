// Types aligned with Django backend models

export interface Categorie {
  id: number;
  nom: string;
}

export interface Auteur {
  id: number;
  nom: string;
}

export interface Livre {
  id: number;
  titre: string;
  isbn: string | null;
  categorie: Categorie | null;
  auteurs: Auteur[];
  description: string;
  image_url: string;
  nb_exemplaires_total: number;
  nb_exemplaires_disponibles: number;
}

export type StatutExemplaire = "DISPONIBLE" | "EMPRUNTE" | "EN_RESERVATION" | "PERDU" | "HS";

export interface Exemplaire {
  id: number;
  livre: Livre;
  code_barres: string;
  statut: StatutExemplaire;
  localisation: string;
}

export type RoleUtilisateur = "BIBLIOTHECAIRE" | "ADMIN" | "ADHERENT";

export interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: RoleUtilisateur;
  matricule: string | null;
  is_active: boolean;
  date_joined: string;
  nom_complet: string;
}

export interface Emprunt {
  id: number;
  exemplaire: Exemplaire;
  adherent: Utilisateur;
  date_emprunt: string;
  date_retour_prevue: string;
  date_retour_effective: string | null;
  est_actif: boolean;
  est_en_retard: boolean;
}

export type StatutReservation = "EN_ATTENTE" | "PRETE_A_RETIRER" | "ANNULEE" | "EXPIREE" | "HONOREE";

export interface Reservation {
  id: number;
  livre: Livre;
  adherent: Utilisateur;
  statut: StatutReservation;
  created_at: string;
  exemplaire: Exemplaire | null;
  expires_at: string | null;
  date_retour_prevue: string | null;
}

export type StatutPenalite = "IMPAYEE" | "PAYEE";

export interface Penalite {
  id: number;
  adherent: Utilisateur;
  emprunt: Emprunt;
  jours_retard: number;
  taux_par_jour: number;
  montant: number;
  statut: StatutPenalite;
  created_at: string;
  paid_at: string | null;
}

export interface ReglesBibliotheque {
  id: number;
  quota_adherent: number;
  quota_bibliothecaire: number;
  quota_admin: number;
  duree_adherent_jours: number;
  duree_bibliothecaire_jours: number;
  duree_admin_jours: number;
  penalite_par_jour: number;
  delai_retrait_reservation_jours: number;
  seuil_blocage_penalites: number;
}

export interface DashboardStats {
  emprunts_actifs: number;
  reservations_en_attente: number;
  reservations_pretes: number;
  penalites_impayees: number;
  montant_impaye: number;
  retards: Emprunt[];
  total_livres: number;
  total_adherents: number;
}

export interface PublicStats {
  total_livres: number;
  total_adherents: number;
  emprunts_30j: number;
  disponibilite_pct: number;
}
