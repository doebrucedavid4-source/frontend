# Backend (Django + DRF)

## Demarrage rapide

1. Creer un environnement virtuel et installer les deps

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
```

2. Creer la base et lancer le serveur

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 8000
```

Le frontend pointe par defaut vers `http://localhost:8000/api/v1`.

## Seed du catalogue

Pour charger un catalogue complet (categories, auteurs, livres, exemplaires) :

```bash
python manage.py seed_catalogue
```

## Comptes par defaut

Deux comptes sont crees automatiquement au premier `migrate` :

- Admin: `admin@bibliotheque.local` / `admin1234`
- Bibliothecaire: `biblio@bibliotheque.local` / `biblio1234`

Vous pouvez surcharger via les variables d'environnement :

- `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_ADMIN_PRENOM`, `DEFAULT_ADMIN_NOM`
- `DEFAULT_BIBLIOTHECAIRE_EMAIL`, `DEFAULT_BIBLIOTHECAIRE_PASSWORD`, `DEFAULT_BIBLIOTHECAIRE_PRENOM`, `DEFAULT_BIBLIOTHECAIRE_NOM`

## Roles

- `ADHERENT` (inscription publique)
- `BIBLIOTHECAIRE`
- `ADMIN`

Le matricule est genere automatiquement selon le role (ex: `ADH-00001`).

L'inscription publique (adherent) demande uniquement: nom, prenom, email, mot de passe.

## Variables d'environnement

- `DJANGO_SECRET_KEY` (optionnel)
- `DJANGO_DEBUG` (default: 1)
- `DJANGO_ALLOWED_HOSTS` (default: localhost,127.0.0.1)
- `CORS_ALLOWED_ORIGINS` (default: http://localhost:5173,http://127.0.0.1:5173)

## Base de donnees (optionnel)

Pour Postgres, definir:

- `DJANGO_DB_ENGINE=django.db.backends.postgresql`
- `DJANGO_DB_NAME=...`
- `DJANGO_DB_USER=...`
- `DJANGO_DB_PASSWORD=...`
- `DJANGO_DB_HOST=...`
- `DJANGO_DB_PORT=5432`
