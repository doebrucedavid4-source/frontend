// API service layer for Django backend
// Configure API_BASE_URL to point to your Django server

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const method = (options.method || "GET").toUpperCase();
  if (!SAFE_METHODS.has(method)) {
    await ensureCsrfToken();
  }
  const csrfToken = getCookie("csrftoken");
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    let message = `API Error: ${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      if (data && typeof data === "object" && "detail" in data) {
        message = String((data as { detail: unknown }).detail || message);
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

async function ensureCsrfToken() {
  if (getCookie("csrftoken")) return;
  await fetch(`${API_BASE_URL}/auth/csrf/`, {
    method: "GET",
    credentials: "include",
  });
}

export function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const maybeResults = (data as { results?: unknown }).results;
    if (Array.isArray(maybeResults)) return maybeResults as T[];
  }
  return [];
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    fetchAPI("/auth/login/", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => fetchAPI("/auth/logout/", { method: "POST" }),
  register: (data: { email: string; prenom: string; nom: string; password: string }) =>
    fetchAPI("/auth/register/", { method: "POST", body: JSON.stringify(data) }),

  // Public
  getPublicStats: () => fetchAPI("/public/stats/"),

  // Admin
  getRegles: () => fetchAPI("/admin/regles/"),
  updateRegles: (data: Record<string, unknown>) =>
    fetchAPI("/admin/regles/", { method: "PATCH", body: JSON.stringify(data) }),

  // Catalog
  getLivres: (params?: { q?: string; categorie?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set("q", params.q);
    if (params?.categorie) searchParams.set("categorie", params.categorie);
    const qs = searchParams.toString();
    return fetchAPI(`/books/${qs ? `?${qs}` : ""}`);
  },
  getLivre: (id: number) => fetchAPI(`/books/${id}/`),
  createLivre: (data: {
    titre: string;
    isbn?: string | null;
    categorie_id?: number | null;
    auteurs_ids?: number[];
    description?: string;
    image_url?: string;
  }) => fetchAPI("/books/", { method: "POST", body: JSON.stringify(data) }),
  updateLivre: (id: number, data: {
    titre?: string;
    isbn?: string | null;
    categorie_id?: number | null;
    auteurs_ids?: number[];
    description?: string;
    image_url?: string;
  }) => fetchAPI(`/books/${id}/`, { method: "PUT", body: JSON.stringify(data) }),
  deleteLivre: (id: number) => fetchAPI(`/books/${id}/`, { method: "DELETE" }),
  getCategories: () => fetchAPI("/categories/"),
  getAuthors: () => fetchAPI("/authors/"),
  createCategorie: (data: { nom: string }) =>
    fetchAPI("/categories/", { method: "POST", body: JSON.stringify(data) }),
  updateCategorie: (id: number, data: { nom: string }) =>
    fetchAPI(`/categories/${id}/`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategorie: (id: number) => fetchAPI(`/categories/${id}/`, { method: "DELETE" }),
  createAuteur: (data: { nom: string }) =>
    fetchAPI("/authors/", { method: "POST", body: JSON.stringify(data) }),
  updateAuteur: (id: number, data: { nom: string }) =>
    fetchAPI(`/authors/${id}/`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAuteur: (id: number) => fetchAPI(`/authors/${id}/`, { method: "DELETE" }),
  reserverLivre: (id: number) => fetchAPI(`/reservations/`, { method: "POST", body: JSON.stringify({ livre: id }) }),

  // Dashboard / Staff
  getDashboard: () => fetchAPI("/staff/dashboard/"),
  getEmprunts: () => fetchAPI("/staff/emprunts/"),
  getAdherents: () => fetchAPI("/staff/adherents/"),
  createAdherent: (data: Record<string, unknown>) =>
    fetchAPI("/staff/adherents/", { method: "POST", body: JSON.stringify(data) }),
  updateAdherent: (id: number, data: Record<string, unknown>) =>
    fetchAPI(`/staff/adherents/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),

  // Emprunts
  creerEmprunt: (data: { code_barres: string; adherent_id: number }) =>
    fetchAPI("/staff/emprunts/nouveau/", { method: "POST", body: JSON.stringify(data) }),
  enregistrerRetour: (code_barres: string) =>
    fetchAPI("/staff/retours/", { method: "POST", body: JSON.stringify({ code_barres }) }),

  // Reservations
  getReservations: () => fetchAPI("/staff/reservations/"),
  annulerReservation: (id: number) =>
    fetchAPI(`/staff/reservations/${id}/annuler/`, { method: "POST" }),
  approuverReservation: (id: number, date_retour_prevue: string) =>
    fetchAPI(`/staff/reservations/${id}/approuver/`, { method: "POST", body: JSON.stringify({ date_retour_prevue }) }),

  // Adhérent
  emprunterLivre: (id: number) =>
    fetchAPI("/me/emprunts/nouveau/", { method: "POST", body: JSON.stringify({ livre: id }) }),

  // Penalites
  getPenalites: () => fetchAPI("/staff/penalites/"),
  payerPenalite: (id: number) =>
    fetchAPI(`/staff/penalites/${id}/payer/`, { method: "POST" }),

  // User (me)
  getProfile: () => fetchAPI("/me/"),
  updateProfile: (data: { email?: string; nom?: string; prenom?: string; password?: string }) =>
    fetchAPI("/me/", { method: "PATCH", body: JSON.stringify(data) }),
  getMesEmprunts: () => fetchAPI("/me/emprunts/"),
  getMesReservations: () => fetchAPI("/me/reservations/"),
  getMesPenalites: () => fetchAPI("/me/penalites/"),
  getNotifications: () => fetchAPI("/me/notifications/"),
};
