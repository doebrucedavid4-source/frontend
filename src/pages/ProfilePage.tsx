import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Save, Shield, UserCircle2 } from "lucide-react";
import { api } from "@/services/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Utilisateur } from "@/types/library";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Utilisateur | null>(null);
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", password: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data as Utilisateur);
        setForm({
          prenom: (data as Utilisateur).prenom ?? "",
          nom: (data as Utilisateur).nom ?? "",
          email: (data as Utilisateur).email ?? "",
          password: "",
        });
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur lors du chargement du profil.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: { email?: string; nom?: string; prenom?: string; password?: string } = {
        email: form.email.trim(),
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
      };
      if (form.password.trim()) {
        payload.password = form.password;
      }
      const updated = await api.updateProfile(payload);
      setProfile(updated as Utilisateur);
      setForm((prev) => ({ ...prev, password: "" }));
      setSuccess("Profil mis à jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setError(null);
    try {
      await api.logout();
    } catch {
      // ignore
    }
    navigate("/connexion", { replace: true });
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">Compte</p>
          <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Mon profil
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-light">
            Mettez à jour vos informations et votre mot de passe.
          </p>
        </div>
        <div className="flex items-center gap-2 glass-card rounded-2xl px-4 py-2.5 border">
          <UserCircle2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Espace personnel</span>
        </div>
      </motion.div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {success && <div className="text-sm text-emerald-700">{success}</div>}
      {loading && !error && <div className="text-sm text-muted-foreground">Chargement du profil</div>}

      {profile && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-card rounded-3xl border p-6 space-y-5"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              <h2 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                Informations personnelles
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prénom</Label>
                <Input
                  className="rounded-xl"
                  value={form.prenom}
                  onChange={(e) => setForm((prev) => ({ ...prev, prenom: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nom</Label>
                <Input
                  className="rounded-xl"
                  value={form.nom}
                  onChange={(e) => setForm((prev) => ({ ...prev, nom: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</Label>
              <Input
                type="email"
                className="rounded-xl"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nouveau mot de passe</Label>
              <Input
                type="password"
                className="rounded-xl"
                placeholder="Laisser vide pour ne pas changer"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-end">
              <Button className="rounded-xl gap-2" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="glass-card rounded-3xl border p-6 space-y-5"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Profil</p>
              <h3 className="text-2xl font-bold mt-1" style={{ fontFamily: "'Playfair Display', serif" }}>
                {profile.nom_complet}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusBadge status={profile.role} />
              {profile.matricule && <StatusBadge status={profile.matricule} />}
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Créé le {new Date(profile.date_joined).toLocaleDateString("fr-FR")}</p>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full rounded-xl gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
