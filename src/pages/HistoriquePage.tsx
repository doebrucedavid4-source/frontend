import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { History, BookOpen, CalendarClock, Search } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { api, normalizeList } from "@/services/api";
import type { Emprunt, Reservation } from "@/types/library";

export default function HistoriquePage() {
  const [emprunts, setEmprunts] = useState<Emprunt[]>([]);
  const [search, setSearch] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([api.getMesEmprunts(), api.getMesReservations()])
      .then(([empruntsData, reservationsData]) => {
        if (!active) return;
        setEmprunts(normalizeList<Emprunt>(empruntsData));
        setReservations(normalizeList<Reservation>(reservationsData));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur lors du chargement de l'historique.");
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

  const filteredReservations = useMemo(() => {
    if (!search) return reservations;
    const q = search.toLowerCase();
    return reservations.filter((r) => {
      const fields = [
        r.livre?.titre,
        r.statut,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [reservations, search]);

  const empruntsHistorique = filteredEmprunts.filter((e) => !e.est_actif);
  const reservationsHistorique = filteredReservations.filter((r) => r.statut !== "EN_ATTENTE" && r.statut !== "PRETE_A_RETIRER");

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">Historique</p>
        <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Mes activités
        </h1>
        <p className="text-muted-foreground text-sm mt-1 font-light">
          Historique de vos emprunts et demandes passées
        </p>
      </motion.div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {loading && !error && <div className="text-sm text-muted-foreground">Chargement de l'historique</div>}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.02 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher dans l'historique..."
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
          { label: "Emprunts terminés", value: empruntsHistorique.length, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Demandes traitées", value: reservationsHistorique.length, icon: CalendarClock, color: "text-slate-600", bg: "bg-slate-500/10" },
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
            Emprunts terminés
          </h2>
          <History className="h-4 w-4 text-muted-foreground" />
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
            {empruntsHistorique.map((e) => (
              <TableRow key={e.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                <TableCell className="font-medium text-sm">{e.exemplaire.livre.titre}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.date_emprunt}</TableCell>
                <TableCell className="text-sm text-emerald-600 font-medium">{e.date_retour_effective}</TableCell>
              </TableRow>
            ))}
            {!loading && !error && empruntsHistorique.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg">Aucun emprunt terminé</p>
                  <p className="text-xs mt-1">Votre historique apparaîtra ici.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="glass-card rounded-3xl border overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <h2 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
            Demandes traitées
          </h2>
          <History className="h-4 w-4 text-muted-foreground" />
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Livre</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Demandée le</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Statut final</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservationsHistorique.map((r) => (
              <TableRow key={r.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                <TableCell className="font-medium text-sm">{r.livre.titre}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell><StatusBadge status={r.statut} /></TableCell>
              </TableRow>
            ))}
            {!loading && !error && reservationsHistorique.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                  <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg">Aucune demande traitée</p>
                  <p className="text-xs mt-1">Vos demandes validées ou annulées apparaîtront ici.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}
