import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CreditCard, Euro, TrendingDown, ShieldCheck, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { api, normalizeList } from "@/services/api";
import type { Penalite } from "@/types/library";

export default function PenalitesPage() {
  const [penalites, setPenalites] = useState<Penalite[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api.getPenalites()
      .then((data) => {
        if (!active) return;
        setPenalites(normalizeList<Penalite>(data));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des pénalités.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const refreshPenalites = async () => {
    const data = await api.getPenalites();
    setPenalites(normalizeList<Penalite>(data));
  };

  const handlePayer = async (id: number) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.payerPenalite(id);
      await refreshPenalites();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du paiement.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPenalites = useMemo(() => {
    if (!search) return penalites;
    const q = search.toLowerCase();
    return penalites.filter((p) => {
      const fields = [
        p.adherent?.nom_complet,
        p.adherent?.email,
        p.emprunt?.exemplaire?.livre?.titre,
        p.statut,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [penalites, search]);

  const impayees = filteredPenalites.filter((p) => p.statut === "IMPAYEE");
  const payees = filteredPenalites.filter((p) => p.statut === "PAYEE");
  const totalImpaye = impayees.reduce((sum, p) => sum + p.montant, 0);
  const totalRecouvre = payees.reduce((sum, p) => sum + p.montant, 0);

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
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">Finance</p>
          <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Pénalités
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-light">
            Suivi des retards et gestion des pénalités financières
          </p>
        </div>
        {totalImpaye > 0 && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive rounded-2xl px-5 py-3 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div>
              <p className="text-xs font-medium opacity-70">Total impayé</p>
              <p className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                {totalImpaye.toFixed(2)} FCFA
              </p>
            </div>
          </div>
        )}
      </motion.div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {loading && !error && <div className="text-sm text-muted-foreground">Chargement des pénalités</div>}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.02 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par adherent, livre, statut..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-2xl h-11"
        />
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {[
          {
            label: "Pénalités impayées", value: `${totalImpaye.toFixed(2)} FCFA`,
            count: `${impayees.length} dossier${impayees.length !== 1 ? "s" : ""}`,
            icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-500/10"
          },
          {
            label: "Montant recouvré", value: `${totalRecouvre.toFixed(2)} FCFA`,
            count: `${payees.length} paiement${payees.length !== 1 ? "s" : ""}`,
            icon: TrendingDown, color: "text-emerald-600", bg: "bg-emerald-500/10"
          },
          {
            label: "Taux de recouvrement",
            value:
              totalImpaye + totalRecouvre > 0
                ? `${Math.round((totalRecouvre / (totalImpaye + totalRecouvre)) * 100)}%`
                : "—",
            count: "sur le total des amendes",
            icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-500/10"
          },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-3xl border p-5 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-2xl ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`h-6 w-6 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{s.value}</p>
              <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">{s.count}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Impayées */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-card rounded-3xl border overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
            Pénalités impayées
          </h2>
          {impayees.length > 0 && (
            <span className="text-xs font-medium bg-destructive/10 text-destructive px-3 py-1 rounded-full">
              {impayees.length} en attente
            </span>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Adhérent</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Livre</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Retard</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Taux/j</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Montant</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Statut</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {impayees.map((p) => (
              <TableRow key={p.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                <TableCell className="text-sm font-medium">{p.adherent.nom_complet}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.emprunt.exemplaire.livre.titre}</TableCell>
                <TableCell>
                  <span className="text-sm font-semibold text-rose-600">{p.jours_retard} j.</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.taux_par_jour.toFixed(2)} FCFA</TableCell>
                <TableCell>
                  <span className="text-sm font-bold text-foreground">{p.montant.toFixed(2)} FCFA</span>
                </TableCell>
                <TableCell><StatusBadge status={p.statut} /></TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 gap-1"
                    onClick={() => handlePayer(p.id)}
                    disabled={submitting}
                  >
                    <CreditCard className="h-3 w-3" />
                    Marquer payée
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && !error && impayees.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-14 text-muted-foreground">
                  <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg">Aucune pénalité impayée 🎉</p>
                  <p className="text-xs mt-1">Tous les adhérents sont à jour.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>

      {/* Payées */}
      {payees.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glass-card rounded-3xl border overflow-hidden"
        >
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50">
            <Euro className="h-4 w-4 text-emerald-600" />
            <h2 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              Historique des paiements
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Adhérent</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Livre</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Montant</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Payée le</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payees.map((p) => (
                <TableRow key={p.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                  <TableCell className="text-sm">{p.adherent.nom_complet}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.emprunt.exemplaire.livre.titre}</TableCell>
                  <TableCell className="text-sm font-semibold text-emerald-600">{p.montant.toFixed(2)} FCFA</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.paid_at ? new Date(p.paid_at).toLocaleDateString("fr-FR") : "—"}
                  </TableCell>
                  <TableCell><StatusBadge status={p.statut} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </div>
  );
}

