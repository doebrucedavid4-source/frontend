import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { AnimatedWaves } from "@/components/ui/animated-waves";
import { api } from "@/services/api";

export function AppLayout() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .getProfile()
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

  const isAdmin = role === "ADMIN";

  return (
    <div className={`min-h-screen bg-background ${isAdmin ? "admin-theme" : ""}`}>
      <Sidebar />
      <div className="lg:pl-[19rem] relative">
        {/* Top wave */}
        <AnimatedWaves position="top" className="opacity-70" />

        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto relative z-10">
          <Outlet />
        </main>

        {/* Bottom wave */}
        <AnimatedWaves position="bottom" className="opacity-70" />
      </div>
    </div>
  );
}
