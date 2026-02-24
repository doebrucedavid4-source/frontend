import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { api, normalizeList } from "@/services/api";
import type { Penalite } from "@/types/library";

export default function MesPenalitesPage() {
  const [penalites, setPenalites] = useState<Penalite[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getMesPenalites()
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

  const filteredPenalites = useMemo(() => {
    if (!search) return penalites;
    const q = search.toLowerCase();
    return penalites.filter((p) => {
      const fields = [
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

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">Finances</p>
        <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Mes pénalités
        </h1>
        <p className="text-muted-foreground text-sm mt-1 font-light">
          Consultez les pénalités liées aux retards d'emprunt
        </p>
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
          placeholder="Rechercher une penalite..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-2xl h-11"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {[
          { label: "Impayées", value: impayees.length, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-500/10" },
          { label: "Payées", value: payees.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-card rounded-3xl border overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
            Détails des pénalités
          </h2>
          <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
            {penalites.length} total
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Livre</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Jours de retard</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Montant</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {penalites.map((p) => (
              <TableRow key={p.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                <TableCell className="font-medium text-sm">{p.emprunt.exemplaire.livre.titre}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.jours_retard}</TableCell>
                <TableCell className="text-sm font-semibold">{p.montant.toFixed(2)} FCFA</TableCell>
                <TableCell><StatusBadge status={p.statut} /></TableCell>
              </TableRow>
            ))}
            {!loading && !error && penalites.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg">Aucune pénalité</p>
                  <p className="text-xs mt-1">Tout est en ordre pour le moment.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
