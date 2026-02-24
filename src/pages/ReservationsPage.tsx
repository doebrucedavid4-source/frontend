import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarClock, Check, X, Clock, CheckCheck, Ban, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { api, normalizeList } from "@/services/api";
import type { Reservation } from "@/types/library";
import { Input } from "@/components/ui/input";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [returnDates, setReturnDates] = useState<Record<number, string>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api.getReservations()
      .then((data) => {
        if (!active) return;
        setReservations(normalizeList<Reservation>(data));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des réservations.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const refreshReservations = async () => {
    const data = await api.getReservations();
    setReservations(normalizeList<Reservation>(data));
  };

  const handleApprove = async (id: number) => {
    if (submitting) return;
    const date_retour_prevue = returnDates[id];
    if (!date_retour_prevue) {
      setError("Veuillez préciser la date de retour avant validation.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.approuverReservation(id, date_retour_prevue);
      await refreshReservations();
      setReturnDates((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'approbation.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.annulerReservation(id);
      await refreshReservations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'annulation.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReservations = useMemo(() => {
    if (!search) return reservations;
    const q = search.toLowerCase();
    return reservations.filter((r) => {
      const fields = [
        r.livre?.titre,
        r.adherent?.nom_complet,
        r.adherent?.email,
        r.statut,
        r.exemplaire?.code_barres,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [reservations, search]);

  const actives = filteredReservations.filter((r) => r.statut === "EN_ATTENTE" || r.statut === "PRETE_A_RETIRER");
  const historique = filteredReservations.filter((r) => r.statut !== "EN_ATTENTE" && r.statut !== "PRETE_A_RETIRER");

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">File d'attente</p>
        <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Réservations
        </h1>
        <p className="text-muted-foreground text-sm mt-1 font-light">
          Gérer les demandes de réservation d'ouvrages indisponibles
        </p>
      </motion.div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {loading && !error && <div className="text-sm text-muted-foreground">Chargement des réservations</div>}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.02 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par livre, adhérent, statut..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-2xl h-11"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: "En attente", value: filteredReservations.filter(r => r.statut === "EN_ATTENTE").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
          { label: "Prêtes à retirer", value: filteredReservations.filter(r => r.statut === "PRETE_A_RETIRER").length, icon: CheckCheck, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Annulées/Expirées", value: filteredReservations.filter(r => r.statut === "ANNULEE" || r.statut === "EXPIREE").length, icon: Ban, color: "text-rose-600", bg: "bg-rose-500/10" },
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
            Réservations actives
          </h2>
          <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
            {actives.length} en cours
          </span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Livre</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Adhérent</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Demandée le</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Retour prévu</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Statut</TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wide">Expiration</TableHead>
              <TableHead className="text-right font-semibold text-xs uppercase tracking-wide">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actives.map((r) => (
              <TableRow key={r.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                <TableCell className="font-medium text-sm">{r.livre?.titre ?? "-"}</TableCell>
                <TableCell className="text-sm">{r.adherent?.nom_complet ?? "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : "-"}
                </TableCell>
                <TableCell className="text-sm">
                  {r.statut === "EN_ATTENTE" ? (
                    <input
                      type="date"
                      className="h-9 rounded-xl border border-input bg-background px-3 text-xs"
                      value={returnDates[r.id] ?? ""}
                      onChange={(e) =>
                        setReturnDates((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                    />
                  ) : (
                    <span className="text-muted-foreground">
                      {r.date_retour_prevue ? new Date(r.date_retour_prevue).toLocaleDateString("fr-FR") : "-"}
                    </span>
                  )}
                </TableCell>
                <TableCell><StatusBadge status={r.statut} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.expires_at ? (
                    <span className="text-amber-600 font-medium">
                      {new Date(r.expires_at).toLocaleDateString("fr-FR")}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {r.statut === "EN_ATTENTE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 gap-1"
                        onClick={() => handleApprove(r.id)}
                        disabled={submitting || !returnDates[r.id]}
                      >
                        <Check className="h-3 w-3" />
                        Approuver
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 gap-1"
                      onClick={() => handleCancel(r.id)}
                      disabled={submitting}
                    >
                      <X className="h-3 w-3" />
                      Annuler
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loading && !error && actives.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-14 text-muted-foreground">
                  <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg">Aucune réservation active</p>
                  <p className="text-xs mt-1">Toutes les demandes ont été traitées.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>

      {historique.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glass-card rounded-3xl border overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border/50">
            <h2 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              Historique des réservations
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Livre</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Adhérent</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Demandée le</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wide">Statut final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historique.map((r) => (
                <TableRow key={r.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                  <TableCell className="font-medium text-sm">{r.livre?.titre ?? "-"}</TableCell>
                  <TableCell className="text-sm">{r.adherent?.nom_complet ?? "-"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString("fr-FR") : "-"}
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
