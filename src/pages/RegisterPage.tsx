import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { Library, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSuccess(false);

    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitting(true);
    try {
      await api.register({
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setSuccess(true);
      setForm({
        prenom: "",
        nom: "",
        email: "",
        password: "",
        confirm: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'inscription.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-100/40 via-transparent to-transparent" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-12">
          <nav className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Library className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  BiblioGest
                </h1>
                <p className="text-[0.6rem] text-muted-foreground uppercase tracking-widest font-medium">
                  Inscription
                </p>
              </div>
            </Link>
            <Link
              to="/connexion"
              className="px-5 py-2 rounded-2xl border border-border text-sm font-semibold hover:bg-muted/40 transition-all"
            >
              Connexion
            </Link>
          </nav>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-2">Créer un compte</p>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Rejoignez la bibliothèque universitaire
              </h2>
              <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                Les adhérents peuvent créer un compte pour consulter le catalogue et emprunter des livres.
              </p>
              <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                  Accès rapide
                </span>
                <span>Comptes sécurisés et traçabilité totale</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-card rounded-3xl border p-6 md:p-8"
            >
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prénom</Label>
                    <Input
                      required
                      className="rounded-xl"
                      value={form.prenom}
                      onChange={(e) => setForm((prev) => ({ ...prev, prenom: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nom</Label>
                    <Input
                      required
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
                    required
                    className="rounded-xl"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                  Le matricule est attribué automatiquement par l'équipe bibliothèque.
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mot de passe</Label>
                    <Input
                      type="password"
                      required
                      className="rounded-xl"
                      value={form.password}
                      onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confirmation</Label>
                    <Input
                      type="password"
                      required
                      className="rounded-xl"
                      value={form.confirm}
                      onChange={(e) => setForm((prev) => ({ ...prev, confirm: e.target.value }))}
                    />
                  </div>
                </div>

                {error && <div className="text-sm text-destructive">{error}</div>}
                {success && (
                  <div className="text-sm text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">
                    Compte créé avec succès. Vous pouvez vous connecter.
                  </div>
                )}

                <Button type="submit" className="w-full rounded-xl" disabled={submitting}>
                  {submitting ? "Création..." : "Créer mon compte"}
                </Button>

                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>Vous avez déjà un compte ?</span>
                  <Link to="/connexion" className="font-semibold text-primary inline-flex items-center gap-1">
                    Accéder
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

