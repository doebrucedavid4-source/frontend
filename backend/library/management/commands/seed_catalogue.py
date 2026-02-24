import json
from urllib.parse import quote, urlencode
from urllib.request import urlopen

from django.core.management.base import BaseCommand
from django.db import transaction

from library.models import Auteur, Categorie, Exemplaire, Livre, ReglesBibliotheque


BOOKS = [
    {
        "titre": "Introduction a l'informatique",
        "isbn": "9780000000101",
        "categorie": "Informatique",
        "auteurs": ["Alan Turing"],
        "description": "Panorama des bases de l'informatique et de la pensee algorithmique.",
        "exemplaires": 3,
    },
    {
        "titre": "Algorithmique et structures de donnees",
        "isbn": "9780000000102",
        "categorie": "Informatique",
        "auteurs": ["Donald Knuth"],
        "description": "Principes, complexite et structures essentielles.",
        "exemplaires": 3,
    },
    {
        "titre": "Reseaux informatiques essentiels",
        "isbn": "9780000000103",
        "categorie": "Informatique",
        "auteurs": ["Claude Shannon"],
        "description": "Fondamentaux des reseaux et de la transmission de l'information.",
        "exemplaires": 2,
    },
    {
        "titre": "Systemes d'exploitation modernes",
        "isbn": "9780000000104",
        "categorie": "Informatique",
        "auteurs": ["Andrew Tanenbaum"],
        "description": "Processus, memoire, systemes de fichiers et securite.",
        "exemplaires": 2,
    },
    {
        "titre": "Bases de donnees relationnelles",
        "isbn": "9780000000105",
        "categorie": "Informatique",
        "auteurs": ["Edgar Codd"],
        "description": "Modele relationnel, conception et requetage.",
        "exemplaires": 2,
    },
    {
        "titre": "Programmation Python",
        "isbn": "9780000000106",
        "categorie": "Informatique",
        "auteurs": ["Guido van Rossum"],
        "description": "Apprendre Python par la pratique et les projets.",
        "exemplaires": 3,
    },
    {
        "titre": "Introduction au machine learning",
        "isbn": "9780000000201",
        "categorie": "Sciences",
        "auteurs": ["Ian Goodfellow"],
        "description": "Notions clefs et cas d'usage en apprentissage automatique.",
        "exemplaires": 2,
    },
    {
        "titre": "Physique generale",
        "isbn": "9780000000202",
        "categorie": "Sciences",
        "auteurs": ["Isaac Newton"],
        "description": "Mecanique, lois du mouvement et bases de la physique.",
        "exemplaires": 2,
    },
    {
        "titre": "Chimie organique",
        "isbn": "9780000000203",
        "categorie": "Sciences",
        "auteurs": ["Marie Curie"],
        "description": "Structures, reactions et applications de la chimie organique.",
        "exemplaires": 2,
    },
    {
        "titre": "Calcul integral",
        "isbn": "9780000000301",
        "categorie": "Mathematiques",
        "auteurs": ["Leonhard Euler"],
        "description": "Techniques d'integration et applications.",
        "exemplaires": 2,
    },
    {
        "titre": "Probabilites et statistiques",
        "isbn": "9780000000302",
        "categorie": "Mathematiques",
        "auteurs": ["Pierre Laplace"],
        "description": "Modeles probabilistes et inference statistique.",
        "exemplaires": 2,
    },
    {
        "titre": "Litterature francaise classique",
        "isbn": "9780000000401",
        "categorie": "Litterature",
        "auteurs": ["Victor Hugo"],
        "description": "Panorama des grands auteurs et mouvements.",
        "exemplaires": 2,
    },
    {
        "titre": "Voyage au centre de la terre",
        "isbn": "9780000000402",
        "categorie": "Litterature",
        "auteurs": ["Jules Verne"],
        "description": "Roman d'aventure et decouverte scientifique.",
        "exemplaires": 3,
    },
    {
        "titre": "1984",
        "isbn": "9780000000403",
        "categorie": "Litterature",
        "auteurs": ["George Orwell"],
        "description": "Dystopie politique et societe de surveillance.",
        "exemplaires": 3,
    },
    {
        "titre": "Introduction a la philosophie",
        "isbn": "9780000000501",
        "categorie": "Philosophie",
        "auteurs": ["Rene Descartes"],
        "description": "Notions fondatrices et methodes.",
        "exemplaires": 2,
    },
    {
        "titre": "Du contrat social",
        "isbn": "9780000000502",
        "categorie": "Philosophie",
        "auteurs": ["Jean-Jacques Rousseau"],
        "description": "Reflexions sur la souverainete et la volonte generale.",
        "exemplaires": 2,
    },
    {
        "titre": "Histoire du XXe siecle",
        "isbn": "9780000000601",
        "categorie": "Histoire",
        "auteurs": ["Fernand Braudel"],
        "description": "Evenements majeurs et evolutions globales.",
        "exemplaires": 2,
    },
    {
        "titre": "Histoire de l'art moderne",
        "isbn": "9780000000602",
        "categorie": "Arts",
        "auteurs": ["Ernst Gombrich"],
        "description": "Panorama des courants artistiques modernes.",
        "exemplaires": 2,
    },
    {
        "titre": "Geographie humaine",
        "isbn": "9780000000701",
        "categorie": "Geographie",
        "auteurs": ["Paul Vidal de la Blache"],
        "description": "Territoires, populations et dynamiques spatiales.",
        "exemplaires": 2,
    },
    {
        "titre": "Principes d'economie",
        "isbn": "9780000000801",
        "categorie": "Economie",
        "auteurs": ["Adam Smith"],
        "description": "Fonctions des marches et fondements de l'economie.",
        "exemplaires": 2,
    },
    {
        "titre": "Introduction a la gestion",
        "isbn": "9780000000802",
        "categorie": "Gestion",
        "auteurs": ["Peter Drucker"],
        "description": "Organisation, pilotage et strategie.",
        "exemplaires": 2,
    },
    {
        "titre": "Droit public general",
        "isbn": "9780000000901",
        "categorie": "Droit",
        "auteurs": ["Hans Kelsen"],
        "description": "Sources, institutions et principes du droit public.",
        "exemplaires": 2,
    },
    {
        "titre": "Sociologie moderne",
        "isbn": "9780000001001",
        "categorie": "Sciences sociales",
        "auteurs": ["Max Weber"],
        "description": "Approches et methodes de la sociologie.",
        "exemplaires": 2,
    },
    {
        "titre": "Pedagogie universitaire",
        "isbn": "9780000001101",
        "categorie": "Education",
        "auteurs": ["Paulo Freire"],
        "description": "Apprentissage, evaluation et pratiques pedagogiques.",
        "exemplaires": 2,
    },
    {
        "titre": "Sante publique",
        "isbn": "9780000001201",
        "categorie": "Sante",
        "auteurs": ["Florence Nightingale"],
        "description": "Prevention, soins et organisation de la sante.",
        "exemplaires": 2,
    },
]


def openlibrary_cover(title: str, author: str | None) -> str:
    query = {"title": title, "limit": 1}
    if author:
        query["author"] = author
    url = f"https://openlibrary.org/search.json?{urlencode(query)}"
    try:
        with urlopen(url, timeout=5) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return ""
    docs = payload.get("docs") or []
    if not docs:
        return ""
    doc = docs[0]
    cover_id = doc.get("cover_i")
    if cover_id:
        return f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg"
    isbns = doc.get("isbn") or []
    if isbns:
        return f"https://covers.openlibrary.org/b/isbn/{isbns[0]}-L.jpg"
    return ""


def cover_url(title: str, author: str | None) -> str:
    cover = openlibrary_cover(title, author)
    if cover:
        return cover
    safe_title = quote(title)
    return f"https://covers.openlibrary.org/b/title/{safe_title}-L.jpg"


class Command(BaseCommand):
    help = "Seed a complete catalog (categories, authors, books, exemplaires)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Supprime le catalogue existant avant de reseeder.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options.get("reset"):
            # Supprimer les donnees qui bloquent les FK d'abord
            from library.models import Emprunt, Penalite, Reservation

            Penalite.objects.all().delete()
            Emprunt.objects.all().delete()
            Reservation.objects.all().delete()
            Exemplaire.objects.all().delete()
            Livre.objects.all().delete()
            Auteur.objects.all().delete()
            Categorie.objects.all().delete()
            self.stdout.write(self.style.WARNING("Catalogue supprime."))

        if not ReglesBibliotheque.objects.exists():
            ReglesBibliotheque.objects.create()
            self.stdout.write(self.style.SUCCESS("ReglesBibliotheque creees."))

        categories = {}
        auteurs = {}

        for entry in BOOKS:
            categories.setdefault(entry["categorie"], None)
            for name in entry["auteurs"]:
                auteurs.setdefault(name, None)

        for nom in categories.keys():
            obj, _ = Categorie.objects.get_or_create(nom=nom)
            categories[nom] = obj

        for nom in auteurs.keys():
            obj, _ = Auteur.objects.get_or_create(nom=nom)
            auteurs[nom] = obj

        created_books = 0
        created_exemplaires = 0

        for entry in BOOKS:
            categorie = categories[entry["categorie"]]
            image_url = entry.get("image_url") or cover_url(entry["titre"], entry["auteurs"][0] if entry["auteurs"] else None)
            defaults = {
                "titre": entry["titre"],
                "categorie": categorie,
                "description": entry.get("description", ""),
                "image_url": image_url,
            }
            livre, created = Livre.objects.get_or_create(isbn=entry["isbn"], defaults=defaults)
            if created:
                created_books += 1
            else:
                updated = False
                if not livre.titre:
                    livre.titre = entry["titre"]
                    updated = True
                if livre.categorie_id is None:
                    livre.categorie = categorie
                    updated = True
                if not livre.description and entry.get("description"):
                    livre.description = entry["description"]
                    updated = True
                if (
                    not livre.image_url
                    or "picsum.photos" in livre.image_url
                    or "covers.openlibrary.org/b/title/" in livre.image_url
                ) and image_url:
                    livre.image_url = image_url
                    updated = True
                if updated:
                    livre.save()

            author_objs = [auteurs[name] for name in entry["auteurs"]]
            if author_objs:
                livre.auteurs.add(*author_objs)

            target = int(entry.get("exemplaires", 1))
            existing_codes = set(
                Exemplaire.objects.filter(livre=livre).values_list("code_barres", flat=True)
            )
            for idx in range(1, target + 1):
                code = f"EX-{livre.id:04d}-{idx}"
                if code in existing_codes:
                    continue
                Exemplaire.objects.create(
                    livre=livre,
                    code_barres=code,
                    localisation="Rayon",
                    statut=Exemplaire.Statut.DISPONIBLE,
                )
                created_exemplaires += 1

        self.stdout.write(self.style.SUCCESS(f"Livres crees: {created_books}"))
        self.stdout.write(self.style.SUCCESS(f"Exemplaires ajoutes: {created_exemplaires}"))
