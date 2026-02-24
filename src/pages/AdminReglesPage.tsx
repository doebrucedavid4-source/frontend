import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Save, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import type { ReglesBibliotheque } from "@/types/library";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const normalizeRules = (data: ReglesBibliotheque): ReglesBibliotheque => ({
  ...data,
  quota_adherent: Number(data.quota_adherent) || 0,
  quota_bibliothecaire: Number(data.quota_bibliothecaire) || 0,
  quota_admin: Number(data.quota_admin) || 0,
  duree_adherent_jours: Number(data.duree_adherent_jours) || 0,
  duree_bibliothecaire_jours: Number(data.duree_bibliothecaire_jours) || 0,
  duree_admin_jours: Number(data.duree_admin_jours) || 0,
  penalite_par_jour: Number(data.penalite_par_jour) || 0,
  delai_retrait_reservation_jours: Number(data.delai_retrait_reservation_jours) || 0,
  seuil_blocage_penalites: Number(data.seuil_blocage_penalites) || 0,
});

export default function AdminReglesPage() {
  const [rules, setRules] = useState<ReglesBibliotheque | null>(null);
  const [form, setForm] = useState<ReglesBibliotheque | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api.getRegles()
      .then((data) => {
        if (!active) return;
        const normalized = normalizeRules(data as ReglesBibliotheque);
        setRules(normalized);
        setForm(normalized);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des règles.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const isDirty = useMemo(() => {
    if (!rules || !form) return false;
    return JSON.stringify(rules) !== JSON.stringify(form);
  }, [rules, form]);

  const updateField = (field: keyof ReglesBibliotheque, value: number) => {
    if (!form) return;
    setForm({ ...form, [field]: value });
  };

  const handleSave = async () => {
    if (!form || saving) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.updateRegles(form);
      const normalized = normalizeRules(updated as ReglesBibliotheque);
      setRules(normalized);
      setForm(normalized);
      setSuccess("Paramètres enregistrés.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour des règles.");
    } finally {
      setSaving(false);
    }
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
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-1">Administration</p>
          <h1 className="text-4xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Paramètres de la bibliothèque
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-light">
            Gérez les quotas, durées et pénalités pour chaque profil.
          </p>
        </div>
        <div className="flex items-center gap-2 glass-card rounded-2xl px-4 py-2.5 border">
          <Shield className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-medium">Espace administrateur</span>
        </div>
      </motion.div>

      {error && <div className="text-sm text-destructive">{error}</div>}
      {success && <div className="text-sm text-emerald-700">{success}</div>}
      {loading && !error && <div className="text-sm text-muted-foreground">Chargement des paramètres</div>}

      {form && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="glass-card rounded-3xl border p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-indigo-600" />
              <h2 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                Quotas d'emprunts
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Adhérent</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  className="rounded-xl"
                  value={form.quota_adherent}
                  onChange={(e) => updateField("quota_adherent", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bibliothécaire</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  className="rounded-xl"
                  value={form.quota_bibliothecaire}
                  onChange={(e) => updateField("quota_bibliothecaire", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  className="rounded-xl"
                  value={form.quota_admin}
                  onChange={(e) => updateField("quota_admin", Number(e.target.value))}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="glass-card rounded-3xl border p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-amber-600" />
              <h2 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                Durées d'emprunt (jours)
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Adhérent</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  className="rounded-xl"
                  value={form.duree_adherent_jours}
                  onChange={(e) => updateField("duree_adherent_jours", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bibliothécaire</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  className="rounded-xl"
                  value={form.duree_bibliothecaire_jours}
                  onChange={(e) => updateField("duree_bibliothecaire_jours", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  className="rounded-xl"
                  value={form.duree_admin_jours}
                  onChange={(e) => updateField("duree_admin_jours", Number(e.target.value))}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="glass-card rounded-3xl border p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-rose-600" />
              <h2 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                Pénalités
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Montant par jour</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  className="rounded-xl"
                  value={form.penalite_par_jour}
                  onChange={(e) => updateField("penalite_par_jour", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seuil de blocage</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  className="rounded-xl"
                  value={form.seuil_blocage_penalites}
                  onChange={(e) => updateField("seuil_blocage_penalites", Number(e.target.value))}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="glass-card rounded-3xl border p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-emerald-600" />
              <h2 className="font-semibold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                Réservations
              </h2>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Délai de retrait (jours)</Label>
              <Input
                type="number"
                min={1}
                step={1}
                className="rounded-xl"
                value={form.delai_retrait_reservation_jours}
                onChange={(e) => updateField("delai_retrait_reservation_jours", Number(e.target.value))}
              />
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <Button
          className="rounded-xl gap-2"
          onClick={handleSave}
          disabled={loading || saving || !isDirty}
        >
          <Save className="h-4 w-4" />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
