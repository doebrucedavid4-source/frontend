import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCircle2, Search } from "lucide-react";
import { api, normalizeList } from "@/services/api";
import { Input } from "@/components/ui/input";

type NotificationItem = {
  id?: number;
  title?: string;
  message?: string;
  created_at?: string;
  type?: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    
    // Marquer les notifications comme lues
    api.markNotificationsAsRead().catch(() => {
      // Ignorer les erreurs de marquage
    });
    
    api
      .getNotifications()
      .then((data) => {
        if (!active) return;
        setNotifications(normalizeList<NotificationItem>(data));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des notifications.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredNotifications = useMemo(() => {
    if (!search) return notifications;
    const q = search.toLowerCase();
    return notifications.filter((n) => {
      const fields = [n.title, n.message, n.type]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return fields.includes(q);
    });
  }, [notifications, search]);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">Alertes</p>
        <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          Notifications
        </h1>
        <p className="text-muted-foreground text-sm mt-1 font-light">
          Suivez les validations et rappels de la bibliothèque
        </p>
      </motion.div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {loading && !error && <div className="text-sm text-muted-foreground">Chargement des notifications</div>}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.02 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une notification..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-2xl h-11"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="glass-card rounded-3xl border p-6"
      >
        {filteredNotifications.length === 0 && !loading && (
          <div className="text-center py-10 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-lg">Aucune notification</p>
            <p className="text-xs mt-1">Les mises à jour s'afficheront ici.</p>
          </div>
        )}
        {filteredNotifications.length > 0 && (
          <div className="space-y-3">
            {filteredNotifications.map((n, index) => (
              <div key={n.id ?? index} className="flex items-start gap-3 rounded-2xl border px-4 py-3">
                <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{n.title || "Mise à jour"}</p>
                  <p className="text-xs text-muted-foreground">{n.message || "Vous avez une nouvelle notification."}</p>
                </div>
                <div className="text-[0.65rem] text-muted-foreground">
                  {n.created_at ? new Date(n.created_at).toLocaleDateString("fr-FR") : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
