// API service layer for Django backend
// Configure API_BASE_URL to point to your Django server

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);
let csrfTokenCache: string | null = null;

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function getCsrfToken(): string | null {
  return getCookie("csrftoken") || csrfTokenCache;
}

function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  if ("detail" in data) {
    return String((data as { detail?: unknown }).detail ?? "");
  }
  const parts: string[] = [];
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      const msg = value.map((item) => String(item)).join(", ");
      if (msg) parts.push(`${key}: ${msg}`);
      continue;
    }
    if (value && typeof value === "object") {
      const nested = Object.entries(value as Record<string, unknown>)
        .map(([nestedKey, nestedValue]) => {
          if (Array.isArray(nestedValue)) {
            return `${nestedKey}: ${nestedValue.map((item) => String(item)).join(", ")}`;
          }
          return `${nestedKey}: ${String(nestedValue)}`;
        })
        .filter(Boolean)
        .join(", ");
      if (nested) parts.push(`${key}: ${nested}`);
      continue;
    }
    if (value != null) {
      parts.push(`${key}: ${String(value)}`);
    }
  }
  return parts.length ? parts.join(" | ") : null;
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const method = (options.method || "GET").toUpperCase();
  if (!SAFE_METHODS.has(method)) {
    await ensureCsrfToken();
  }
  const csrfToken = getCsrfToken();
  
  const headers: HeadersInit = {
    ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
    ...options.headers,
  };
  
  // Ne pas forcer le Content-Type si on a des FormData (pour multipart/form-data)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    headers,
    ...options,
  });
  if (!response.ok) {
    let message = `API Error: ${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      const extracted = extractErrorMessage(data);
      if (extracted) message = extracted;
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
  if (getCsrfToken()) return;
  const resp = await fetch(`${API_BASE_URL}/auth/csrf/`, {
    method: "GET",
    credentials: "include",
  });
  if (!resp.ok) return;
  try {
    const data = await resp.json();
    if (data && typeof data === "object" && "csrfToken" in data) {
      csrfTokenCache = String((data as { csrfToken?: unknown }).csrfToken || "");
    }
  } catch {
    // ignore parse errors
  }
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
  createExemplaires: (livreId: number, data: { nb_exemplaires: number; localisation?: string }) =>
    fetchAPI(`/books/${livreId}/exemplaires/`, { method: "POST", body: JSON.stringify(data) }),
  uploadLivreImage: (livreId: number, imageFile: File) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    return fetchAPI(`/books/${livreId}/upload-image/`, { method: "POST", body: formData });
  },
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
  getUnreadNotificationsCount: () => fetchAPI("/me/notifications/unread-count/"),
  markNotificationsAsRead: () => fetchAPI("/me/notifications/mark-read/", { method: "POST" }),
};
