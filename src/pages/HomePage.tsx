import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen, Users, ArrowLeftRight, CalendarClock, AlertTriangle,
  Library, Search, ChevronDown, ArrowRight, CheckCircle2, Play
} from "lucide-react";
import { motion } from "framer-motion";
import heroVideo from "@/assets/library-hero.mp4";
import { api } from "@/services/api";
import type { PublicStats } from "@/types/library";

const steps = [
  {
    number: "01",
    icon: Users,
    title: "Inscrivez vos utilisateurs",
    description: "Enregistrez les bibliothécaires et administrateurs. Chaque utilisateur dispose d'un profil avec son historique complet.",
    link: "/adherents",
    linkLabel: "Gérer les utilisateurs",
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-600",
  },
  {
    number: "02",
    icon: Search,
    title: "Explorez le catalogue",
    description: "Recherchez par titre, auteur, ISBN ou catégorie. Consultez la disponibilité en temps réel de chaque exemplaire.",
    link: "/livres",
    linkLabel: "Parcourir le catalogue",
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-600",
  },
  {
    number: "03",
    icon: ArrowLeftRight,
    title: "Gérez les emprunts & retours",
    description: "Enregistrez les prêts, suivez les dates de retour prévues et traitez les retours en quelques clics.",
    link: "/emprunts",
    linkLabel: "Voir les emprunts",
    color: "from-emerald-500/20 to-green-500/20",
    borderColor: "border-emerald-500/30",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-600",
  },
  {
    number: "04",
    icon: CalendarClock,
    title: "Traitez les réservations",
    description: "Permettez aux utilisateurs de réserver un ouvrage indisponible et recevez des notifications quand il est prêt.",
    link: "/reservations",
    linkLabel: "Voir les réservations",
    color: "from-violet-500/20 to-purple-500/20",
    borderColor: "border-violet-500/30",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-600",
  },
  {
    number: "05",
    icon: AlertTriangle,
    title: "Suivez les pénalités",
    description: "Les retards sont détectés automatiquement. Consultez les amendes, relancez les utilisateurs et gérez les paiements.",
    link: "/penalites",
    linkLabel: "Gérer les pénalités",
    color: "from-rose-500/20 to-red-500/20",
    borderColor: "border-rose-500/30",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-600",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

export default function HomePage() {
  const flowRef = useRef<HTMLDivElement>(null);

  const [publicStats, setPublicStats] = useState<PublicStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setStatsError(null);
    api.getPublicStats()
      .then((data) => {
        if (!active) return;
        setPublicStats(data as PublicStats);
      })
      .catch((err) => {
        if (!active) return;
        setStatsError(err instanceof Error ? err.message : "Erreur lors du chargement des statistiques.");
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = [
    {
      label: "Ouvrages catalogués",
      value: publicStats ? publicStats.total_livres.toLocaleString("fr-FR") : "—",
    },
    {
      label: "Adhérents actifs",
      value: publicStats ? publicStats.total_adherents.toLocaleString("fr-FR") : "—",
    },
    {
      label: "Emprunts / mois",
      value: publicStats ? publicStats.emprunts_30j.toLocaleString("fr-FR") : "—",
    },
    {
      label: "Disponibilité",
      value: publicStats ? `${publicStats.disponibilite_pct.toFixed(1)}%` : "—",
    },
  ];

  const scrollToFlow = () => {
    flowRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ─── Video Hero ─── */}
      <header className="relative h-screen flex flex-col">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src={heroVideo}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Library className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                BiblioGest
              </h1>
              <p className="text-[0.6rem] text-white/60 uppercase tracking-widest font-medium">
                Gestion Universitaire
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/inscription"
              className="px-5 py-2.5 rounded-2xl bg-white text-gray-900 font-semibold text-sm hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Inscription
            </Link>
            <Link
              to="/connexion"
              className="px-6 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md text-white font-semibold text-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              Tableau de bord
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-sm font-medium mb-8">
              <Play className="h-3.5 w-3.5" />
              Bibliothèque universitaire numérique
            </div>

            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Votre bibliothèque,
              <br />
              <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 bg-clip-text text-transparent">
                simplifiée
              </span>
            </h2>

            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              BiblioGest vous guide à travers chaque étape de la gestion de votre bibliothèque, de l'inscription des utilisateurs au suivi des pénalités.
            </p>

            <div className="mt-10 flex flex-wrap gap-4 justify-center">
              <button
                onClick={scrollToFlow}
                className="px-8 py-3.5 rounded-2xl bg-white text-gray-900 font-semibold text-sm hover:scale-105 transition-all duration-300 shadow-xl flex items-center gap-2"
              >
                Découvrir le processus
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                to="/dashboard"
                className="px-8 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md text-white font-semibold text-sm border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                Accéder directement
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={scrollToFlow}
          className="relative z-10 mx-auto mb-8 flex flex-col items-center gap-2 text-white/50 hover:text-white/80 transition-colors cursor-pointer"
        >
          <span className="text-xs font-medium tracking-wider uppercase">Défiler</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </button>
      </header>

      {/* ─── Stats bar ─── */}
      <section className="relative -mt-1 bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              custom={i}
              variants={fadeUp}
            >
              <p className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                {stat.value}
              </p>
              <p className="text-sm opacity-60 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
        {statsError && (
          <p className="text-center text-xs text-white/60 pb-6">{statsError}</p>
        )}
      </section>

      {/* ─── Flow / Steps ─── */}
      <section ref={flowRef} className="px-6 md:px-12 py-24 max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Comment ça marche
          </p>
          <h3 className="text-3xl md:text-5xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Un processus en 5 étapes
          </h3>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-lg">
            Suivez le flux pour maîtriser chaque aspect de la gestion de votre bibliothèque.
          </p>
        </motion.div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-border via-primary/30 to-border hidden md:block" />
          <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-border via-primary/30 to-border md:hidden" />

          <div className="space-y-16 md:space-y-20">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={step.number}
                  className="relative"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  custom={i}
                  variants={fadeUp}
                >
                  {/* Step number dot */}
                  <div className={`absolute left-5 md:left-1/2 md:-translate-x-1/2 -translate-x-1/2 top-2 z-10 h-7 w-7 rounded-full bg-background border-2 ${step.borderColor} flex items-center justify-center`}>
                    <span className="text-[0.6rem] font-bold text-foreground">{step.number}</span>
                  </div>

                  {/* Card - alternating layout on desktop */}
                  <div className={`ml-16 md:ml-0 md:w-[45%] ${isLeft ? "md:mr-auto md:pr-8" : "md:ml-auto md:pl-8"}`}>
                    <div className={`glass-card rounded-3xl p-7 border ${step.borderColor} hover:scale-[1.02] transition-all duration-300 group`}>
                      <div className="flex items-start gap-4">
                        <div className={`h-12 w-12 rounded-2xl ${step.iconBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                          <step.icon className={`h-6 w-6 ${step.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-bold text-foreground mb-2">{step.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                          <Link
                            to={step.link}
                            className={`inline-flex items-center gap-1.5 mt-4 text-sm font-semibold ${step.iconColor} hover:underline`}
                          >
                            {step.linkLabel}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Why BiblioGest ─── */}
      <section className="px-6 md:px-12 py-20 bg-gradient-to-b from-transparent via-muted/30 to-transparent">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h3 className="text-3xl md:text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Pourquoi BiblioGest ?
            </h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              "Recherche multi-critères : titre, auteur, catégorie, ISBN",
              "Suivi en temps réel de chaque exemplaire",
              "Notifications automatiques pour les retards",
              "Calcul automatique des pénalités",
              "Tableau de bord avec statistiques clés",
              "Interface intuitive adaptée au mobile",
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-start gap-3 glass-card rounded-2xl p-5"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
              >
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-foreground font-medium text-sm">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-6 md:px-12 py-20">
        <motion.div
          className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-amber-600 opacity-90" />
          <div className="relative z-10 p-10 md:p-16 text-center">
            <h3 className="text-2xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Prêt à commencer ?
            </h3>
            <p className="mt-4 text-white/80 max-w-lg mx-auto text-lg">
              Accédez au tableau de bord et commencez à gérer votre bibliothèque en suivant le processus étape par étape.
            </p>
            <Link
              to="/dashboard"
              className="mt-8 inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-white text-gray-900 font-bold hover:scale-105 transition-all duration-300 shadow-xl text-sm"
            >
              Accéder à BiblioGest
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="px-6 md:px-12 py-8 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} BiblioGest — Système de gestion de bibliothèque universitaire
        </p>
      </footer>
    </div>
  );
}

