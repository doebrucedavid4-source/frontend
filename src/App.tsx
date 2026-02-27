import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import LivresPage from "./pages/LivresPage";
import ProfilePage from "./pages/ProfilePage";
import AdherentsPage from "./pages/AdherentsPage";
import EmpruntsPage from "./pages/EmpruntsPage";
import ReservationsPage from "./pages/ReservationsPage";
import PenalitesPage from "./pages/PenalitesPage";
import AdminReglesPage from "./pages/AdminReglesPage";
import MesDemandesPage from "./pages/MesDemandesPage";
import MesEmpruntsPage from "./pages/MesEmpruntsPage";
import MesPenalitesPage from "./pages/MesPenalitesPage";
import NotificationsPage from "./pages/NotificationsPage";
import HistoriquePage from "./pages/HistoriquePage";
import NotFound from "./pages/NotFound";
import RequireAuth from "./components/auth/RequireAuth";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="inscription" element={<RegisterPage />} />
        <Route path="connexion" element={<LoginPage />} />
        <Route element={<RequireAuth roles={["BIBLIOTHECAIRE", "ADMIN", "ADHERENT"]} />}>
          <Route element={<AppLayout />}>
            <Route path="livres" element={<LivresPage />} />
            <Route path="profil" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
        </Route>
        <Route element={<RequireAuth roles={["ADHERENT"]} />}>
          <Route element={<AppLayout />}>
            <Route path="mes-demandes" element={<MesDemandesPage />} />
            <Route path="mes-emprunts" element={<MesEmpruntsPage />} />
            <Route path="mes-penalites" element={<MesPenalitesPage />} />
            <Route path="historique" element={<HistoriquePage />} />
          </Route>
        </Route>
        <Route element={<RequireAuth roles={["BIBLIOTHECAIRE", "ADMIN"]} />}>
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="emprunts" element={<EmpruntsPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="penalites" element={<PenalitesPage />} />
          </Route>
        </Route>
        <Route element={<RequireAuth roles={["ADMIN"]} />}>
          <Route element={<AppLayout />}>
            <Route path="adherents" element={<AdherentsPage />} />
            <Route path="regles" element={<AdminReglesPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

