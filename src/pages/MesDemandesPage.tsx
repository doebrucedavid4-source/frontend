import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, CheckCheck, Ban, Clock, Search } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { api, normalizeList } from "@/services/api";
import type { Reservation } from "@/types/library";

export default function MesDemandesPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getMesReservations()
      .then((data) => {
        if (!active) return;
        setReservations(normalizeList<Reservation>(data));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des demandes.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredReservations = useMemo(() => {
    if (!search) return reservations;
    const q = search.toLowerCase();
    return reservations.filter((r) => {
      const fields = [
        r.livre?.titre,
        r.livre?.auteurs?.map((a) => a.nom).join(" "),
        r.statut,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [reservations, search]);

  const actives = filteredReservations.filter((r) => r.statut === "EN_ATTENTE" || r.statut === "PRETE_A_RETIRER");
  const historiques = filteredReservations.filter((r) => r.statut !== "EN_ATTENTE" && r.statut !== "PRETE_A_RETIRER");

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">Suivi</p>
        <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Mes demandes
        </h1>
        <p className="text-muted-foreground text-sm mt-1 font-light">
          Suivez la validation de vos demandes d'emprunt
        </p>
      </motion.div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {loading && !error && <div className="text-sm text-muted-foreground">Chargement des demandes</div>}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.02 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par livre ou statut..."
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
          { label: "En attente", value: actives.filter((r) => r.statut === "EN_ATTENTE").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
          { label: "Prêtes à retirer", value: actives.filter((r) => r.statut === "PRETE_A_RETIRER").length, icon: CheckCheck, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Annulées/Expirées", value: historiques.filter((r) => r.statut === "ANNULEE" || r.statut === "EXPIREE").length, icon: Ban, color: "text-rose-600", bg: "bg-rose-500/10" },
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
            Demandes en cours
          </h2>
          <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
            {actives.length} en cours
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Livre</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Demandée le</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Retour prévu</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Statut</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Expiration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actives.map((r) => (
              <TableRow key={r.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                <TableCell className="font-medium text-sm">{r.livre.titre}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.date_retour_prevue ? new Date(r.date_retour_prevue).toLocaleDateString("fr-FR") : "—"}
                </TableCell>
                <TableCell><StatusBadge status={r.statut} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.expires_at ? new Date(r.expires_at).toLocaleDateString("fr-FR") : "—"}
                </TableCell>
              </TableRow>
            ))}
            {!loading && !error && actives.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg">Aucune demande active</p>
                  <p className="text-xs mt-1">Ajoutez un livre au panier pour lancer une demande.</p>
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
              Historique des demandes
            </h2>
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
              {historiques.map((r) => (
                <TableRow key={r.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium text-sm">{r.livre.titre}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell><StatusBadge status={r.statut} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </div>
  );
}
