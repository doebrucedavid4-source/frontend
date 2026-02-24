import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { Library, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.login(email.trim(), password);
      const profile = await api.getProfile();
      const role = profile?.role as string | undefined;
      if (role === "BIBLIOTHECAIRE" || role === "ADMIN") {
        navigate("/dashboard");
      } else {
        navigate("/livres");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion.");
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
                  Connexion
                </p>
              </div>
            </Link>
            <Link
              to="/inscription"
              className="px-5 py-2 rounded-2xl border border-border text-sm font-semibold hover:bg-muted/40 transition-all"
            >
              Inscription
            </Link>
          </nav>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-2">Accès direct</p>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                Connectez-vous à votre espace
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-card rounded-3xl border p-6 md:p-8"
            >
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    required
                    className="rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mot de passe</Label>
                  <Input
                    type="password"
                    required
                    className="rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && <div className="text-sm text-destructive">{error}</div>}
                <Button type="submit" className="w-full rounded-xl" disabled={submitting}>
                  {submitting ? "Connexion..." : "Se connecter"}
                </Button>
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>Pas encore de compte ?</span>
                  <Link to="/inscription" className="font-semibold text-primary inline-flex items-center gap-1">
                    Créer un compte
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

