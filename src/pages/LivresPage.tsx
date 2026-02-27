import { useEffect, useMemo, useState, useRef } from "react";
import { Search, BookOpen, Filter, BookMarked, ShoppingBag, Clock, CheckCircle2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { api, normalizeList } from "@/services/api";
import type { Auteur, Categorie, Livre, Reservation } from "@/types/library";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const categoryColors = [
  "from-blue-500/20 to-cyan-500/20 border-blue-400/20",
  "from-violet-500/20 to-purple-500/20 border-violet-400/20",
  "from-amber-500/20 to-orange-500/20 border-amber-400/20",
  "from-emerald-500/20 to-green-500/20 border-emerald-400/20",
  "from-rose-500/20 to-pink-500/20 border-rose-400/20",
  "from-sky-500/20 to-indigo-500/20 border-sky-400/20",
];

const openLibraryCover = (livre: Livre) => {
  const isbn = livre.isbn?.replace(/[^0-9X]/gi, "");
  if (isbn && isbn.length >= 10) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
  }
  return `https://covers.openlibrary.org/b/title/${encodeURIComponent(livre.titre)}-M.jpg`;
};

const fallbackCover = (livre: Livre) => {
  const seed = encodeURIComponent(livre.isbn || `livre-${livre.id}`);
  return `https://picsum.photos/300/450?random=${livre.id}`;
};

const coverUrl = (livre: Livre) => {
  if (livre.image_url && livre.image_url.trim()) {
    return livre.image_url;
  }
  return openLibraryCover(livre);
};

export default function LivresPage() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [livres, setLivres] = useState<Livre[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [auteurs, setAuteurs] = useState<Auteur[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([
      api.getLivres(),
      api.getCategories(),
      api.getAuthors(),
      api.getProfile().catch(() => null),
    ])
      .then(([livresData, categoriesData, auteursData, profile]) => {
        if (!active) return;
        setLivres(normalizeList<Livre>(livresData));
        setCategories(normalizeList<Categorie>(categoriesData));
        setAuteurs(normalizeList<Auteur>(auteursData));
        setRole(profile?.role ?? null);
        setIsStaff(profile?.role === "BIBLIOTHECAIRE" || profile?.role === "ADMIN");
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur lors du chargement du catalogue.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (role !== "ADHERENT") {
      setReservations([]);
      return;
    }
    let active = true;
    setLoadingReservations(true);
    api.getMesReservations()
      .then((data) => {
        if (!active) return;
        setReservations(normalizeList<Reservation>(data));
      })
      .catch(() => {
        if (!active) return;
        setReservations([]);
      })
      .finally(() => {
        if (!active) return;
        setLoadingReservations(false);
      });
    return () => {
      active = false;
    };
  }, [role]);

  const [bookForm, setBookForm] = useState({
    id: undefined as number | undefined,
    titre: "",
    isbn: "",
    categorie_id: "",
    auteurs_ids: [] as number[],
    description: "",
    image_url: "",
  });
  const [catForm, setCatForm] = useState({ id: undefined as number | undefined, nom: "" });
  const [auteurForm, setAuteurForm] = useState({ id: undefined as number | undefined, nom: "" });
  const [saving, setSaving] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [exemplairesForm, setExemplairesForm] = useState({ nb: 1, localisation: "Rayon" });
  const [addingExemplaires, setAddingExemplaires] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const gestionLivresRef = useRef<HTMLDivElement>(null);
  const gestionCategoriesRef = useRef<HTMLDivElement>(null);
  const gestionAuteursRef = useRef<HTMLDivElement>(null);

  const scrollToElement = (ref: React.RefObject<HTMLDivElement>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };
  const isAdherent = role === "ADHERENT";
  const selectedBook = selectedBookId ? livres.find((l) => l.id === selectedBookId) : null;
  const getActiveReservation = (bookId: number) =>
    reservations.find(
      (r) =>
        r.livre.id === bookId &&
        (r.statut === "EN_ATTENTE" || r.statut === "PRETE_A_RETIRER")
    );
  const activeReservationForSelected = selectedBook ? getActiveReservation(selectedBook.id) : null;
  const handleCoverError = (e: React.SyntheticEvent<HTMLImageElement>, livre: Livre) => {
    const target = e.currentTarget;
    const attempt = parseInt(target.dataset.fallback || "0");
    
    const sources = [
      openLibraryCover(livre),
      fallbackCover(livre),
      `https://via.placeholder.com/300x450?text=${encodeURIComponent(livre.titre.substring(0, 20))}`,
    ];
    
    if (attempt < sources.length - 1) {
      target.dataset.fallback = String(attempt + 1);
      target.src = sources[attempt + 1];
      return;
    }
    
    // Si tout a échoué, cacher l'image et afficher l'icon
    target.style.display = "none";
    const fallbackIcon = target.parentElement?.querySelector(".book-icon-fallback");
    if (fallbackIcon) {
      fallbackIcon.classList.remove("hidden");
    }
  };

  useEffect(() => {
    if (selectedBookId && !livres.some((l) => l.id === selectedBookId)) {
      setSelectedBookId(null);
    }
  }, [livres, selectedBookId]);

  const filtered = useMemo(() => {
    return livres.filter((l) => {
      const matchSearch =
        !search ||
        l.titre.toLowerCase().includes(search.toLowerCase()) ||
        l.auteurs.some((a) => a.nom.toLowerCase().includes(search.toLowerCase())) ||
        (l.isbn && l.isbn.includes(search));
      const matchCat = !catFilter || l.categorie?.id?.toString() === catFilter;
      return matchSearch && matchCat;
    });
  }, [livres, search, catFilter]);

  const computedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.nom.localeCompare(b.nom));
  }, [categories]);

  const refreshCatalog = async () => {
    const [livresData, categoriesData, auteursData] = await Promise.all([
      api.getLivres(),
      api.getCategories(),
      api.getAuthors(),
    ]);
    setLivres(normalizeList<Livre>(livresData));
    setCategories(normalizeList<Categorie>(categoriesData));
    setAuteurs(normalizeList<Auteur>(auteursData));
  };
  const refreshReservations = async () => {
    if (role !== "ADHERENT") return;
    const data = await api.getMesReservations();
    setReservations(normalizeList<Reservation>(data));
  };

  const handleAddExemplaires = async () => {
    if (!selectedBook) return;
    setAddingExemplaires(true);
    try {
      await api.createExemplaires(selectedBook.id, {
        nb_exemplaires: exemplairesForm.nb,
        localisation: exemplairesForm.localisation,
      });
      await refreshCatalog();
      setExemplairesForm({ nb: 1, localisation: "Rayon" });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout des exemplaires.");
    } finally {
      setAddingExemplaires(false);
    }
  };

  const handleUploadLivreImage = async (livreId: number, file: File) => {
    setUploadingImage(true);
    try {
      await api.uploadLivreImage(livreId, file);
      await refreshCatalog();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload de l'image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveBook = async () => {
    if (!bookForm.titre.trim()) return;
    setSaving(true);
    try {
      const payload = {
        titre: bookForm.titre.trim(),
        isbn: bookForm.isbn.trim() || null,
        categorie_id: bookForm.categorie_id ? Number(bookForm.categorie_id) : null,
        auteurs_ids: bookForm.auteurs_ids,
        description: bookForm.description.trim(),
        image_url: bookForm.image_url.trim(),
      };
      if (bookForm.id) {
        await api.updateLivre(bookForm.id, payload);
      } else {
        await api.createLivre(payload);
      }
      setBookForm({ id: undefined, titre: "", isbn: "", categorie_id: "", auteurs_ids: [], description: "", image_url: "" });
      await refreshCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement du livre.");
    } finally {
      setSaving(false);
    }
  };

  const handleDemandeEmprunt = async (id: number) => {
    setSaving(true);
    setError(null);
    try {
      await api.reserverLivre(id);
      await refreshReservations();
      await refreshCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la demande d'emprunt.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async (id: number) => {
    if (!confirm("Supprimer ce livre ?")) return;
    setSaving(true);
    try {
      await api.deleteLivre(id);
      await refreshCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategorie = async () => {
    if (!catForm.nom.trim()) return;
    setSaving(true);
    try {
      if (catForm.id) {
        await api.updateCategorie(catForm.id, { nom: catForm.nom.trim() });
      } else {
        await api.createCategorie({ nom: catForm.nom.trim() });
      }
      setCatForm({ id: undefined, nom: "" });
      await refreshCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la catégorie.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategorie = async (id: number) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    setSaving(true);
    try {
      await api.deleteCategorie(id);
      await refreshCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAuteur = async () => {
    if (!auteurForm.nom.trim()) return;
    setSaving(true);
    try {
      if (auteurForm.id) {
        await api.updateAuteur(auteurForm.id, { nom: auteurForm.nom.trim() });
      } else {
        await api.createAuteur({ nom: auteurForm.nom.trim() });
      }
      setAuteurForm({ id: undefined, nom: "" });
      await refreshCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de l'auteur.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAuteur = async (id: number) => {
    if (!confirm("Supprimer cet auteur ?")) return;
    setSaving(true);
    try {
      await api.deleteAuteur(id);
      await refreshCatalog();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">Bibliothèque</p>
          <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Catalogue
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-light">
            {livres.length} ouvrages au catalogue — Recherchez par titre, auteur ou ISBN
          </p>
        </div>
        <div className="flex items-center gap-2 glass-card rounded-2xl px-4 py-2 border text-sm font-medium">
          <BookMarked className="h-4 w-4 text-primary" />
          <span>{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      </motion.div>

      {isAdherent && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          <div className="glass-card rounded-3xl border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Mon panier</p>
                <h2 className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Demandes d'emprunt
                </h2>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-2xl border px-3 py-2 text-center">
                <div className="text-muted-foreground">Total</div>
                <div className="text-lg font-semibold">{reservations.length}</div>
              </div>
              <div className="rounded-2xl border px-3 py-2 text-center">
                <div className="text-muted-foreground">En attente</div>
                <div className="text-lg font-semibold">
                  {reservations.filter((r) => r.statut === "EN_ATTENTE").length}
                </div>
              </div>
              <div className="rounded-2xl border px-3 py-2 text-center">
                <div className="text-muted-foreground">Prêtes</div>
                <div className="text-lg font-semibold">
                  {reservations.filter((r) => r.statut === "PRETE_A_RETIRER").length}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {loadingReservations && (
                <div className="text-sm text-muted-foreground">Chargement des demandes…</div>
              )}
              {!loadingReservations && reservations.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Aucune demande pour le moment. Ajoutez un livre au panier.
                </div>
              )}
              {!loadingReservations && reservations.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-2xl border px-3 py-2 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.livre.titre}</p>
                    <p className="text-muted-foreground truncate">{r.livre.auteurs.map((a) => a.nom).join(", ")}</p>
                    {r.date_retour_prevue && (
                      <p className="text-[0.65rem] text-muted-foreground">
                        Retour prevu: {new Date(r.date_retour_prevue).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={r.statut} className="shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-3xl border p-5 space-y-4 lg:col-span-2">
            <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Suivi des demandes
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Toutes les demandes doivent etre validees par le bibliothecaire avant l'emprunt.
                  </p>
                </div>
              </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {[
                { label: "En attente", value: reservations.filter(r => r.statut === "EN_ATTENTE").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
                { label: "Prêtes à retirer", value: reservations.filter(r => r.statut === "PRETE_A_RETIRER").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
                { label: "Traitée", value: reservations.filter(r => ["ANNULEE", "EXPIREE", "HONOREE"].includes(r.statut)).length, icon: BookMarked, color: "text-slate-600", bg: "bg-slate-500/10" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border px-3 py-3 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-2xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">{s.value}</div>
                    <div className="text-muted-foreground">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un livre, un auteur, un ISBN…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-2xl glass-card border h-11"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="h-11 rounded-2xl border border-border bg-card/60 backdrop-blur-sm pl-10 pr-10 text-sm appearance-none cursor-pointer font-medium"
          >
            <option value="">Toutes catégories</option>
            {computedCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Book Grid */}
      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}
      {!error && loading && (
        <div className="text-sm text-muted-foreground">Chargement du catalogue</div>
      )}
      {!error && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((livre, i) => {
            const colorClass = categoryColors[(livre.categorie?.id ?? 0) % categoryColors.length];
            return (
              <motion.div
                key={livre.id}
                className="group glass-card rounded-3xl border overflow-hidden hover:scale-[1.02] hover:shadow-xl transition-all duration-300 cursor-pointer"
                initial="hidden"
                animate="visible"
                custom={i}
                variants={fadeUp}
                onClick={() => setSelectedBookId(livre.id)}
              >
                {/* Cover area */}
                <div className={`h-48 bg-gradient-to-br ${colorClass} flex items-center justify-center relative overflow-hidden`}>
                  <img
                    src={coverUrl(livre)}
                    alt={livre.titre}
                    data-fallback="0"
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => handleCoverError(e, livre)}
                  />
                  <BookOpen className="book-icon-fallback h-14 w-14 text-foreground/20 absolute hidden" />
                  <div className="absolute top-3 right-3">
                    <StatusBadge
                      status={livre.nb_exemplaires_disponibles > 0 ? "DISPONIBLE" : "EMPRUNTE"}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-base leading-tight line-clamp-2 text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {livre.titre}
                  </h3>
                  <p className="text-xs text-muted-foreground font-light">{livre.auteurs.map((a) => a.nom).join(", ")}</p>
                  {livre.categorie && (
                    <span className="inline-block text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium tracking-wide">
                      {livre.categorie.nom}
                    </span>
                  )}
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{livre.nb_exemplaires_disponibles}</span>/{livre.nb_exemplaires_total} exemplaire{livre.nb_exemplaires_total > 1 ? "s" : ""}
                    </span>
                    {livre.isbn && (
                      <span className="text-[10px] text-muted-foreground font-mono">{livre.isbn.slice(-4)}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-xl border border-border bg-card/80 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBookId(livre.id);
                    }}
                  >
                    Voir détails
                  </button>
                  {isAdherent && (
                    <button
                      type="button"
                      disabled={saving || Boolean(getActiveReservation(livre.id))}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDemandeEmprunt(livre.id);
                      }}
                      className="mt-3 w-full rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      {getActiveReservation(livre.id)
                        ? "Demande en cours"
                        : "Demander l'emprunt"}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20">
          <BookOpen className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-foreground font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
            Aucun ouvrage trouvé
          </p>
          <p className="text-sm text-muted-foreground mt-1">Essayez d'autres mots-clés ou catégories.</p>
        </div>
      )}

      {selectedBook && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setSelectedBookId(null)}
        >
          <div
            className="relative w-full max-w-[700px] rounded-3xl border border-amber-200/60 bg-gradient-to-br from-white via-amber-50 to-slate-50 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full border border-border bg-white/80 p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedBookId(null)}
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl overflow-hidden border bg-gradient-to-br from-slate-900/5 via-transparent to-amber-500/10 aspect-[2/3]">
                <img
                  src={coverUrl(selectedBook)}
                  alt={selectedBook.titre}
                  data-fallback="0"
                  className="h-full w-full object-cover"
                  onError={(e) => handleCoverError(e, selectedBook)}
                />
                <div className="book-icon-fallback h-full w-full flex items-center justify-center hidden bg-gradient-to-br from-slate-900/5 via-transparent to-amber-500/10">
                  <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {selectedBook.titre}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedBook.auteurs.map((a) => a.nom).join(", ")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedBook.categorie && (
                    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {selectedBook.categorie.nom}
                    </span>
                  )}
                  <StatusBadge status={selectedBook.nb_exemplaires_disponibles > 0 ? "DISPONIBLE" : "EMPRUNTE"} />
                  {activeReservationForSelected && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700">
                      <Clock className="h-3.5 w-3.5" />
                      Demande en cours
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedBook.description || "Aucune description disponible pour cet ouvrage."}
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border px-3 py-2">
                    <div className="text-xs text-muted-foreground">ISBN</div>
                    <div className="font-mono">{selectedBook.isbn || "—"}</div>
                  </div>
                  <div className="rounded-xl border px-3 py-2">
                    <div className="text-xs text-muted-foreground">Disponibles</div>
                    <div className="font-semibold">
                      {selectedBook.nb_exemplaires_disponibles}/{selectedBook.nb_exemplaires_total}
                    </div>
                  </div>
                  {activeReservationForSelected?.date_retour_prevue && (
                    <div className="rounded-xl border px-3 py-2">
                      <div className="text-xs text-muted-foreground">Retour prévu</div>
                      <div className="font-semibold">
                        {new Date(activeReservationForSelected.date_retour_prevue).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  )}
                </div>

                {isAdherent && (
                  <button
                    type="button"
                    disabled={saving || Boolean(getActiveReservation(selectedBook.id))}
                    onClick={() => {
                      handleDemandeEmprunt(selectedBook.id);
                    }}
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-amber-500 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60"
                  >
                    {getActiveReservation(selectedBook.id)
                      ? "Demande en cours"
                      : "Demander l'emprunt"}
                  </button>
                )}

                {isStaff && (
                  <div className="space-y-3 border-t border-border/30 pt-4">
                    <h3 className="font-semibold text-sm">Ajouter des exemplaires</h3>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={exemplairesForm.nb}
                        onChange={(e) =>
                          setExemplairesForm({
                            ...exemplairesForm,
                            nb: Math.max(1, Number(e.target.value)),
                          })
                        }
                        placeholder="Nombre"
                        className="w-20 h-10 rounded-xl"
                      />
                      <select
                        value={exemplairesForm.localisation}
                        onChange={(e) =>
                          setExemplairesForm({
                            ...exemplairesForm,
                            localisation: e.target.value,
                          })
                        }
                        className="h-10 rounded-xl border border-border bg-card/60 px-3 text-sm flex-1"
                      >
                        <option value="Rayon">Rayon</option>
                        <option value="Réserve">Réserve</option>
                        <option value="Magasin">Magasin</option>
                        <option value="Autre">Autre</option>
                      </select>
                      <button
                        onClick={handleAddExemplaires}
                        disabled={addingExemplaires}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Ajouter
                      </button>
                    </div>

                    <h3 className="font-semibold text-sm mt-4">Télécharger une image</h3>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0];
                          if (file && selectedBook) {
                            handleUploadLivreImage(selectedBook.id, file);
                            e.currentTarget.value = "";
                          }
                        }}
                        disabled={uploadingImage}
                        className="flex-1 text-sm"
                      />
                      <label className="text-xs text-muted-foreground">Max 5MB (JPEG, PNG, WebP, GIF)</label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isStaff && (
        <div className="mt-10 space-y-8">
          <div className="glass-card rounded-3xl border p-6 space-y-4" ref={gestionLivresRef}>
            <h2 className="text-xl font-semibold">Gestion des livres</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Titre"
                value={bookForm.titre}
                onChange={(e) => setBookForm({ ...bookForm, titre: e.target.value })}
              />
              <Input
                placeholder="ISBN"
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
              />
              <select
                value={bookForm.categorie_id}
                onChange={(e) => setBookForm({ ...bookForm, categorie_id: e.target.value })}
                className="h-11 rounded-2xl border border-border bg-card/60 backdrop-blur-sm px-3 text-sm"
              >
                <option value="">Catégorie</option>
                {computedCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
              <select
                multiple
                value={bookForm.auteurs_ids.map(String)}
                onChange={(e) =>
                  setBookForm({
                    ...bookForm,
                    auteurs_ids: Array.from(e.target.selectedOptions).map((o) => Number(o.value)),
                  })
                }
                className="h-24 rounded-2xl border border-border bg-card/60 backdrop-blur-sm px-3 text-sm"
              >
                {auteurs.map((a) => (
                  <option key={a.id} value={a.id}>{a.nom}</option>
                ))}
              </select>
              <Input
                placeholder="Image URL"
                value={bookForm.image_url}
                onChange={(e) => setBookForm({ ...bookForm, image_url: e.target.value })}
              />
              <Input
                placeholder="Description"
                value={bookForm.description}
                onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveBook}
                disabled={saving}
                className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                  {bookForm.id ? "Mettre à jour" : "Ajouter"}
              </button>
              {bookForm.id && (
                <button
                  onClick={() => setBookForm({ id: undefined, titre: "", isbn: "", categorie_id: "", auteurs_ids: [], description: "", image_url: "" })}
                  className="rounded-xl border px-4 py-2 text-sm"
                >
                  Annuler
                </button>
              )}
            </div>
            <div className="mt-4 grid gap-2">
              {livres.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                  <div className="truncate">{l.titre}</div>
                  <div className="flex gap-2">
                    <button
                      className="text-primary"
                      onClick={() => {
                        setBookForm({
                          id: l.id,
                          titre: l.titre,
                          isbn: l.isbn ?? "",
                          categorie_id: l.categorie?.id?.toString() ?? "",
                          auteurs_ids: l.auteurs.map((a) => a.id),
                          description: l.description ?? "",
                          image_url: l.image_url ?? "",
                        });
                        scrollToElement(gestionLivresRef);
                      }}
                    >
                      Modifier
                    </button>
                    <button className="text-destructive" onClick={() => handleDeleteBook(l.id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card rounded-3xl border p-6 space-y-3" ref={gestionCategoriesRef}>
              <h2 className="text-lg font-semibold">Catégories</h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Nom de catégorie"
                  value={catForm.nom}
                  onChange={(e) => setCatForm({ ...catForm, nom: e.target.value })}
                />
                <button
                  onClick={handleSaveCategorie}
                  disabled={saving}
                  className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
                >
                  {catForm.id ? "Mettre à jour" : "Ajouter"}
                </button>
              </div>
              <div className="grid gap-2">
                {computedCategories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                    <span>{c.nom}</span>
                    <div className="flex gap-2">
                      <button 
                        className="text-primary" 
                        onClick={() => {
                          setCatForm({ id: c.id, nom: c.nom });
                          scrollToElement(gestionCategoriesRef);
                        }}
                      >
                        Modifier
                      </button>
                      <button className="text-destructive" onClick={() => handleDeleteCategorie(c.id)}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-3xl border p-6 space-y-3" ref={gestionAuteursRef}>
              <h2 className="text-lg font-semibold">Auteurs</h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Nom de l'auteur"
                  value={auteurForm.nom}
                  onChange={(e) => setAuteurForm({ ...auteurForm, nom: e.target.value })}
                />
                <button
                  onClick={handleSaveAuteur}
                  disabled={saving}
                  className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground"
                >
                  {auteurForm.id ? "Mettre à jour" : "Ajouter"}
                </button>
              </div>
              <div className="grid gap-2">
                {auteurs.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
                    <span>{a.nom}</span>
                    <div className="flex gap-2">
                      <button 
                        className="text-primary" 
                        onClick={() => {
                          setAuteurForm({ id: a.id, nom: a.nom });
                          scrollToElement(gestionAuteursRef);
                        }}
                      >
                        Modifier
                      </button>
                      <button className="text-destructive" onClick={() => handleDeleteAuteur(a.id)}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

