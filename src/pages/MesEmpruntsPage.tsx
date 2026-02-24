import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, CheckCircle2, Search } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { api, normalizeList } from "@/services/api";
import type { Emprunt } from "@/types/library";

export default function MesEmpruntsPage() {
  const [emprunts, setEmprunts] = useState<Emprunt[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getMesEmprunts()
      .then((data) => {
        if (!active) return;
        setEmprunts(normalizeList<Emprunt>(data));
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
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [emprunts, search]);

  const actifs = filteredEmprunts.filter((e) => e.est_actif);
  const historiques = filteredEmprunts.filter((e) => !e.est_actif);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">Emprunts</p>
        <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Mes emprunts
        </h1>
        <p className="text-muted-foreground text-sm mt-1 font-light">
          Consultez vos prêts en cours et vos retours
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
          placeholder="Rechercher un emprunt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-2xl h-11"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          { label: "Actifs", value: actifs.length, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-500/10" },
          { label: "En retard", value: actifs.filter((e) => e.est_en_retard).length, icon: Clock, color: "text-rose-600", bg: "bg-rose-500/10" },
          { label: "Retournés", value: historiques.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
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
            Emprunts actifs
          </h2>
          <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
            {actifs.length} en cours
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Livre</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Emprunté le</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Retour prévu</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actifs.map((e) => (
              <TableRow key={e.id} className={`border-border/30 hover:bg-muted/20 transition-colors ${e.est_en_retard ? "bg-destructive/3" : ""}`}>
                <TableCell className="font-medium text-sm">{e.exemplaire.livre.titre}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.date_emprunt}</TableCell>
                <TableCell className={`text-sm ${e.est_en_retard ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                  {e.date_retour_prevue}
                </TableCell>
                <TableCell>
                  {e.est_en_retard ? <StatusBadge status="retard" /> : <StatusBadge status="EMPRUNTE" />}
                </TableCell>
              </TableRow>
            ))}
            {!loading && !error && actifs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg">Aucun emprunt actif</p>
                  <p className="text-xs mt-1">Lorsque vous empruntez, ils apparaissent ici.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>

      {historiques.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glass-card rounded-3xl border overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border/50">
            <h2 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              Historique des emprunts
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Livre</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Emprunté le</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Retourné le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historiques.map((e) => (
                <TableRow key={e.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium text-sm">{e.exemplaire.livre.titre}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.date_emprunt}</TableCell>
                  <TableCell className="text-sm text-emerald-600 font-medium">{e.date_retour_effective}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </div>
  );
}
