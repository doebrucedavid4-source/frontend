import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { api } from "@/services/api";

type RequireAuthProps = {
  roles?: string[];
};

export default function RequireAuth({ roles }: RequireAuthProps) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getProfile()
      .then((profile) => {
        if (!active) return;
        setRole(profile?.role ?? null);
      })
      .catch(() => {
        if (!active) return;
        setRole(null);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>;
  }

  if (!role) {
    return <Navigate to="/connexion" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/connexion" replace />;
  }

  return <Outlet />;
}
