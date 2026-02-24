import { BookOpen, Users, ArrowLeftRight, CalendarClock, AlertTriangle, TrendingUp, Clock, BarChart3, Settings } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { DashboardStats } from "@/types/library";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Bonjour" : now.getHours() < 18 ? "Bon après-midi" : "Bonsoir";
  const roleLabel = role === "ADMIN" ? "Admin" : role === "BIBLIOTHECAIRE" ? "Bibliothécaire" : "BiblioGest";
  const subtitle = role === "ADMIN"
    ? "Espace d'administration pour piloter la bibliotheque"
    : "Vue d'ensemble de la bibliotheque universitaire";
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api.getDashboard()
      .then((data) => {
        if (!active) return;
        setStats(data as DashboardStats);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur lors du chargement du tableau de bord.");
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
    let active = true;
    api.getProfile()
      .then((profile) => {
        if (!active) return;
        setRole(profile?.role ?? null);
      })
      .catch(() => {
        if (!active) return;
        setRole(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const displayStats: DashboardStats = stats ?? {
    emprunts_actifs: 0,
    reservations_en_attente: 0,
    reservations_pretes: 0,
    penalites_impayees: 0,
    montant_impaye: 0,
    retards: [],
    total_livres: 0,
    total_adherents: 0,
  };
  const isAdmin = role === "ADMIN";


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
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">
            {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            {greeting}, {roleLabel}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-light">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 glass-card rounded-2xl px-4 py-2.5 border">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium">Système actif</span>
        </div>
      </motion.div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {loading && !error && <div className="text-sm text-muted-foreground">Chargement du tableau de bord</div>}

      {/* Main KPI Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { title: "Emprunts actifs", value: displayStats.emprunts_actifs, icon: ArrowLeftRight, color: "bg-blue-500/15", iconColor: "text-blue-600" },
          { title: "Réservations", value: displayStats.reservations_en_attente, icon: CalendarClock, color: "bg-amber-500/15", iconColor: "text-amber-600" },
          { title: "Pénalités impayées", value: displayStats.penalites_impayees, icon: AlertTriangle, color: "bg-rose-500/15", iconColor: "text-rose-600", subtitle: `${displayStats.montant_impaye.toFixed(2)} FCFA total` },
          { title: "Ouvrages au catalogue", value: displayStats.total_livres, icon: BookOpen, color: "bg-violet-500/15", iconColor: "text-violet-600" },
        ].map((s, i) => (
          <motion.div key={s.title} custom={i} variants={fadeUp}>
            <div className="glass-card rounded-3xl border p-5 hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{s.title}</p>
                  <p className="text-4xl font-bold mt-1 text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>{s.value}</p>
                  {s.subtitle && <p className="text-xs text-muted-foreground mt-1">{s.subtitle}</p>}
                </div>
                <div className={`${s.color} rounded-2xl p-3`}>
                  <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Retards */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card rounded-3xl border overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-rose-600" />
              <h2 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                Emprunts en retard
              </h2>
            </div>
            <StatusBadge status="retard" />
          </div>
          <div className="p-5">
            {displayStats.retards.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <ArrowLeftRight className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-foreground">Aucun retard actuellement</p>
                <p className="text-xs text-muted-foreground mt-1">Tous les emprunts sont dans les délais.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayStats.retards.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-4 rounded-2xl bg-destructive/5 border border-destructive/10">
                    <div>
                      <p className="font-medium text-sm">{e.exemplaire.livre.titre}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {e.adherent.nom_complet} · {e.exemplaire.code_barres}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs text-destructive font-semibold">Dû le</p>
                      <p className="text-xs text-destructive">{e.date_retour_prevue}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card rounded-3xl border overflow-hidden"
        >
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border/50">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              Actions rapides
            </h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {[
              { to: "/emprunts", icon: ArrowLeftRight, label: "Nouvel emprunt", color: "text-blue-600", bg: "bg-blue-500/10" },
              { to: "/emprunts", icon: ArrowLeftRight, label: "Retour livre", color: "text-emerald-600", bg: "bg-emerald-500/10" },
              ...(isAdmin ? [{ to: "/adherents", icon: Users, label: "Nouvel utilisateur", color: "text-violet-600", bg: "bg-violet-500/10" }] : []),
              ...(isAdmin ? [{ to: "/regles", icon: Settings, label: "Paramètres", color: "text-indigo-600", bg: "bg-indigo-500/10" }] : []),
              { to: "/reservations", icon: CalendarClock, label: "Réservations", color: "text-amber-600", bg: "bg-amber-500/10" },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-border/50 glass-card hover:scale-[1.03] hover:shadow-md transition-all duration-300 text-center group"
              >
                <div className={`h-10 w-10 rounded-2xl ${item.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <span className="text-xs font-semibold text-foreground">{item.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="glass-card rounded-3xl border p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{displayStats.total_adherents}</p>
            <p className="text-xs text-muted-foreground">Adhérents actifs</p>
          </div>
        </div>
        <div className="glass-card rounded-3xl border p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <CalendarClock className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{displayStats.reservations_pretes}</p>
            <p className="text-xs text-muted-foreground">Prêtes à retirer</p>
          </div>
        </div>
        <div className="glass-card rounded-3xl border p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{displayStats.montant_impaye.toFixed(2)} FCFA</p>
            <p className="text-xs text-muted-foreground">Montant impayé</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

