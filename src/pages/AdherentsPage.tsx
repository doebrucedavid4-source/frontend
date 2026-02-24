import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Search, UserPlus, Users, Mail, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { api, normalizeList } from "@/services/api";
import type { Utilisateur } from "@/types/library";

const roleColors: Record<string, string> = {
  ADHERENT: "from-emerald-500/20 to-green-500/20",
  BIBLIOTHECAIRE: "from-violet-500/20 to-purple-500/20",
  ADMIN: "from-amber-500/20 to-orange-500/20",
};

const roleInitials: Record<string, string> = {
  ADHERENT: "bg-emerald-500/20 text-emerald-700",
  BIBLIOTHECAIRE: "bg-violet-500/20 text-violet-700",
  ADMIN: "bg-amber-500/20 text-amber-700",
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function AdherentsPage() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adherents, setAdherents] = useState<Utilisateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    role: "ADHERENT",
    password: "",
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api.getAdherents()
      .then((data) => {
        if (!active) return;
        setAdherents(normalizeList<Utilisateur>(data));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des utilisateurs.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return adherents;
    const q = search.toLowerCase();
    return adherents.filter(
      (u) =>
        u.nom_complet.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.matricule && u.matricule.toLowerCase().includes(q))
    );
  }, [adherents, search]);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createAdherent({
        prenom: form.prenom,
        nom: form.nom,
        email: form.email,
        role: form.role,
        password: form.password,
      });
      const data = await api.getAdherents();
      setAdherents(normalizeList<Utilisateur>(data));
      setDialogOpen(false);
      setForm({ prenom: "", nom: "", email: "", role: "ADHERENT", password: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création de l'utilisateur.");
    } finally {
      setSubmitting(false);
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
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">Gestion</p>
          <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Utilisateurs
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-light">
            {adherents.length} comptes actifs — Gestion des utilisateurs de la bibliothèque
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl gap-2 shadow-lg">
              <UserPlus className="h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl glass-card border">
            <DialogHeader>
              <DialogTitle style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl">
                Nouvel utilisateur
              </DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prénom</Label>
                  <Input
                    placeholder="Prénom"
                    required
                    className="rounded-xl"
                    value={form.prenom}
                    onChange={(e) => setForm((prev) => ({ ...prev, prenom: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nom</Label>
                  <Input
                    placeholder="Nom"
                    required
                    className="rounded-xl"
                    value={form.nom}
                    onChange={(e) => setForm((prev) => ({ ...prev, nom: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  placeholder="email@univ.test"
                  required
                  className="rounded-xl"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rôle</Label>
                <select
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                >
                  <option value="ADHERENT">Adhérent</option>
                  <option value="BIBLIOTHECAIRE">Bibliothécaire</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mot de passe</Label>
                <Input
                  type="password"
                  placeholder=""
                  required
                  className="rounded-xl"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <Button type="submit" className="w-full rounded-xl" disabled={submitting}>
                {submitting ? "Création..." : "Créer l'utilisateur"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {loading && !error && <div className="text-sm text-muted-foreground">Chargement des utilisateurs</div>}

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, email ou matricule…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-2xl h-11"
        />
      </motion.div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((u, i) => (
          <motion.div
            key={u.id}
            className="glass-card rounded-3xl border overflow-hidden hover:scale-[1.02] hover:shadow-lg transition-all duration-300"
            initial="hidden"
            animate="visible"
            custom={i}
            variants={fadeUp}
          >
            {/* Top gradient banner */}
            <div className={`h-16 bg-gradient-to-br ${roleColors[u.role] ?? "from-muted/30 to-muted/10"}`} />

            <div className="px-5 pb-5 -mt-8">
              {/* Avatar */}
              <div className={`h-14 w-14 rounded-2xl ${roleInitials[u.role] ?? "bg-muted text-foreground"} flex items-center justify-center text-lg font-bold border-4 border-card mb-3`}>
                {u.prenom[0]}{u.nom[0]}
              </div>

              <h3 className="font-semibold text-lg text-foreground leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                {u.nom_complet}
              </h3>

              <div className="mt-1 mb-3 flex flex-wrap gap-2">
                <StatusBadge status={u.role} />
                <StatusBadge status={u.is_active ? "active" : "inactive"} />
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-xs">{u.email}</span>
                </div>
                {u.matricule && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-mono text-xs">{u.matricule}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20">
          <Users className="h-14 w-14 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-foreground font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
            Aucun utilisateur trouvé
          </p>
          <p className="text-sm text-muted-foreground mt-1">Modifiez votre recherche.</p>
        </div>
      )}
    </div>
  );
}

