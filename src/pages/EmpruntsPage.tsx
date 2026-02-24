import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeftRight, CornerDownLeft, Plus, BookOpen, Clock, CheckCircle2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { api, normalizeList } from "@/services/api";
import type { Emprunt, Utilisateur } from "@/types/library";

export default function EmpruntsPage() {
  const [codeBarresRetour, setCodeBarresRetour] = useState("");
  const [codeBarresEmprunt, setCodeBarresEmprunt] = useState("");
  const [adherentKey, setAdherentKey] = useState("");
  const [emprunts, setEmprunts] = useState<Emprunt[]>([]);
  const [adherents, setAdherents] = useState<Utilisateur[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([api.getEmprunts(), api.getAdherents()])
      .then(([empruntsData, adherentsData]) => {
        if (!active) return;
        setEmprunts(normalizeList<Emprunt>(empruntsData));
        setAdherents(normalizeList<Utilisateur>(adherentsData));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des emprunts.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredEmprunts = useMemo(() => {
    if (!search) return emprunts;
    const q = search.toLowerCase();
    return emprunts.filter((e) => {
      const fields = [
        e.exemplaire?.livre?.titre,
        e.exemplaire?.code_barres,
        e.adherent?.nom_complet,
        e.adherent?.email,
        e.adherent?.matricule,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [emprunts, search]);

  const actifs = filteredEmprunts.filter((e) => e.est_actif);
  const historique = filteredEmprunts.filter((e) => !e.est_actif);

  const refreshEmprunts = async () => {
    const data = await api.getEmprunts();
    setEmprunts(normalizeList<Emprunt>(data));
  };

  const handleCreateEmprunt = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const key = adherentKey.trim().toLowerCase();
      const found = adherents.find(
        (a) => a.email.toLowerCase() === key || (a.matricule && a.matricule.toLowerCase() === key)
      );
      if (!found) {
        throw new Error("Adhérent introuvable. Utilisez un email ou un matricule valide.");
      }
      await api.creerEmprunt({ code_barres: codeBarresEmprunt.trim(), adherent_id: found.id });
      await refreshEmprunts();
      setCodeBarresEmprunt("");
      setAdherentKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création de l'emprunt.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetour = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.enregistrerRetour(codeBarresRetour.trim());
      await refreshEmprunts();
      setCodeBarresRetour("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement du retour.");
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
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">Circulation</p>
        <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Emprunts & Retours
        </h1>
        <p className="text-muted-foreground text-sm mt-1 font-light">
          Gérer les prêts et enregistrer les retours d'exemplaires
        </p>
      </motion.div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {loading && !error && <div className="text-sm text-muted-foreground">Chargement des emprunts</div>}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.02 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par livre, adherent, code-barres..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-2xl h-11"
        />
      </motion.div>

      {/* Quick stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: "Emprunts actifs", value: actifs.length, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "En retard", value: actifs.filter(e => e.est_en_retard).length, icon: Clock, color: "text-rose-600", bg: "bg-rose-500/10" },
          { label: "Retournés", value: historique.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-3xl border p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-2xl ${s.bg} flex items-center justify-center`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        <div className="glass-card rounded-3xl border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <Plus className="h-4 w-4 text-blue-600" />
            </div>
            <h2 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              Nouvel emprunt
            </h2>
          </div>
          <form className="space-y-3" onSubmit={handleCreateEmprunt}>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code-barres exemplaire</Label>
              <Input
                placeholder="EX-XXX-X"
                className="rounded-xl"
                value={codeBarresEmprunt}
                onChange={(e) => setCodeBarresEmprunt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email ou matricule adhérent</Label>
              <Input
                placeholder="email@univ.test ou ETU2024XXX"
                className="rounded-xl"
                value={adherentKey}
                onChange={(e) => setAdherentKey(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full rounded-xl gap-2" disabled={submitting}>
              <ArrowLeftRight className="h-4 w-4" />
              {submitting ? "Enregistrement..." : "Enregistrer l'emprunt"}
            </Button>
          </form>
        </div>

        <div className="glass-card rounded-3xl border p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <CornerDownLeft className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              Retour d'exemplaire
            </h2>
          </div>
          <form className="space-y-3" onSubmit={handleRetour}>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code-barres exemplaire</Label>
              <Input
                placeholder="Scanner ou saisir le code-barres"
                value={codeBarresRetour}
                onChange={(e) => setCodeBarresRetour(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <p className="text-xs text-muted-foreground font-light">
              Les pénalités seront calculées automatiquement si l'exemplaire est en retard.
            </p>
            <Button type="submit" variant="outline" className="w-full rounded-xl gap-2 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10" disabled={submitting}>
              <CornerDownLeft className="h-4 w-4" />
              {submitting ? "Enregistrement..." : "Enregistrer le retour"}
            </Button>
          </form>
        </div>
      </motion.div>

      {/* Tabs table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Tabs defaultValue="actifs">
          <TabsList className="rounded-2xl">
            <TabsTrigger value="actifs" className="rounded-xl">Actifs ({actifs.length})</TabsTrigger>
            <TabsTrigger value="historique" className="rounded-xl">Historique ({historique.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="actifs">
            <div className="glass-card rounded-3xl border overflow-hidden mt-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Livre</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Code-barres</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Adhérent</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Emprunté le</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Retour prévu</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actifs.map((e) => (
                    <TableRow key={e.id} className={`border-border/30 hover:bg-muted/20 transition-colors ${e.est_en_retard ? "bg-destructive/3" : ""}`}>
                      <TableCell className="font-medium text-sm">{e.exemplaire.livre.titre}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{e.exemplaire.code_barres}</TableCell>
                      <TableCell className="text-sm">{e.adherent.nom_complet}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.date_emprunt}</TableCell>
                      <TableCell className={`text-sm ${e.est_en_retard ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                        {e.date_retour_prevue}
                      </TableCell>
                      <TableCell>
                        {e.est_en_retard ? <StatusBadge status="retard" /> : <StatusBadge status="EMPRUNTE" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="historique">
            <div className="glass-card rounded-3xl border overflow-hidden mt-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Livre</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Adhérent</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Emprunté le</TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wide">Retourné le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historique.map((e) => (
                    <TableRow key={e.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                      <TableCell className="font-medium text-sm">{e.exemplaire.livre.titre}</TableCell>
                      <TableCell className="text-sm">{e.adherent.nom_complet}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.date_emprunt}</TableCell>
                      <TableCell className="text-sm text-emerald-600 font-medium">{e.date_retour_effective}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

