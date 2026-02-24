import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowLeftRight,
  CalendarClock,
  AlertTriangle,
  Library,
  Menu,
  X,
  Bell,
  History,
  BookMarked,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/services/api";

const staffNavItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/livres", icon: BookOpen, label: "Catalogue" },
  { to: "/emprunts", icon: ArrowLeftRight, label: "Emprunts & Retours" },
  { to: "/reservations", icon: CalendarClock, label: "Réservations" },
  { to: "/penalites", icon: AlertTriangle, label: "Pénalités" },
];

const adminNavItems = [
  { to: "/adherents", icon: Users, label: "Utilisateurs" },
  { to: "/regles", icon: Settings, label: "Paramètres" },
];

const adherentNavItems = [
  { to: "/livres", icon: BookOpen, label: "Catalogue" },
  { to: "/mes-demandes", icon: CalendarClock, label: "Mes demandes" },
  { to: "/mes-emprunts", icon: BookMarked, label: "Mes emprunts" },
  { to: "/mes-penalites", icon: AlertTriangle, label: "Mes pénalités" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/historique", icon: History, label: "Historique" },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    api
      .getProfile()
      .then((profile) => {
        if (!active) return;
        setRole(profile?.role ?? null);
        setName(profile?.nom_complet ?? null);
      })
      .catch(() => {
        if (!active) return;
        setRole(null);
        setName(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setMobileOpen(false);
    navigate("/connexion", { replace: true });
  };

  const isAdmin = role === "ADMIN";
  const isStaff = role === "BIBLIOTHECAIRE" || isAdmin;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl text-[0.9rem] font-medium transition-all duration-300 ${
      isActive
        ? "bg-white/15 text-white shadow-lg shadow-cyan-500/10 border border-white/20 backdrop-blur-sm"
        : "text-white/80 hover:bg-white/10 hover:text-white hover:shadow-md hover:scale-[1.02] border border-transparent"
    }`;

  const nav = (
    <nav className="flex flex-col gap-1.5 px-4 py-5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-white/40 px-4 mb-2">
        Navigation
      </p>
      {(isStaff ? staffNavItems : adherentNavItems).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/dashboard"}
          className={linkClass}
          onClick={() => setMobileOpen(false)}
        >
          <item.icon className="h-[1.1rem] w-[1.1rem] shrink-0" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
      {isAdmin && (
        <>
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-white/40 px-4 mt-4 mb-2">
            Administration
          </p>
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClass}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="h-[1.1rem] w-[1.1rem] shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </>
      )}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-sidebar-bg text-sidebar-foreground shadow-lg"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-3 bottom-3 left-3 z-40 w-[17rem] glass-sidebar rounded-3xl flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Section 1: Branding */}
        <div className="px-6 pt-7 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <Library className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-[1.15rem] font-bold text-white tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                BiblioGest
              </h1>
              <p className="text-[0.65rem] text-white/50 font-medium tracking-wide uppercase">
                Gestion Universitaire
              </p>
            </div>
          </div>
        </div>

        <div className="h-8" />

        {/* Section 2: Navigation */}
        <div className="flex-1 overflow-y-auto px-1 py-2">
          {nav}
        </div>

        <div className="h-8" />

        {/* Section 3: Profile */}
        <div className="px-5 pt-5 pb-7">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-cyan-400/30 to-blue-500/20 flex items-center justify-center text-xs font-bold text-white backdrop-blur-sm">
              {name ? name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() : "BG"}
            </div>
            <div className="text-sm">
              <p className="text-white font-semibold text-[0.85rem]">{name || "BiblioGest"}</p>
              <p className="text-white/50 text-[0.7rem]">
                {role === "ADMIN"
                  ? "Admin"
                  : role === "BIBLIOTHECAIRE"
                    ? "Bibliothécaire"
                    : role === "ADHERENT"
                      ? "Adhérent"
                      : "Utilisateur"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <NavLink
              to="/profil"
              className="flex-1 text-center text-[0.72rem] font-semibold rounded-xl border border-white/15 text-white/80 hover:text-white hover:bg-white/10 px-3 py-2 transition-all"
              onClick={() => setMobileOpen(false)}
            >
              Mon profil
            </NavLink>
            <button
              className="flex-1 text-[0.72rem] font-semibold rounded-xl border border-white/15 text-white/80 hover:text-white hover:bg-white/10 px-3 py-2 transition-all"
              onClick={handleLogout}
              type="button"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
