export type AnimeStatus = "WATCHING" | "COMPLETED" | "PAUSED" | "DROPPED" | "PLANNED";

export interface UserPreferences {
  display_mode?: "grid" | "list";
  reduce_motion?: boolean;
  theme?: "obsidian" | "charcoal" | "high-contrast";
  default_sort?: string;
  default_filter?: string;
}

export interface User {
  id: string;
  email: string;
  display_name?: string | null;
  is_active: boolean;
  is_verified: boolean;
  preferences: UserPreferences;
  created_at: string;
}

export interface AnimeEntry {
  id: string;
  user_id: string;
  title: string;
  normalized_title: string;
  alternate_title?: string | null;
  poster_url?: string | null;
  status: AnimeStatus;
  total_episodes?: number | null;
  watched_episodes: number;
  rating?: number | null;
  notes?: string | null;
  is_favorite: boolean;
  genres: string[];
  started_at?: string | null;
  completed_at?: string | null;
  metadata_provider?: string | null;
  provider_media_id?: string | null;
  metadata_last_checked_at?: string | null;
  metadata_last_updated_at?: string | null;
  metadata_sync_status?: string | null;
  total_episodes_source?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnimeListResponse {
  items: AnimeEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserStats {
  total_titles: number;
  watching_count: number;
  completed_count: number;
  planned_count: number;
  paused_count: number;
  dropped_count: number;
  total_episodes_watched: number;
  completion_rate: number;
  mean_rating?: number | null;
  ratings_distribution: Record<number, number>;
  status_distribution: Record<string, number>;
  genre_distribution: Record<string, number>;
  recent_updates: AnimeEntry[];
  favorite_titles: AnimeEntry[];
}

export interface PersonalDataExport {
  user_id: string;
  email: string;
  exported_at: string;
  total_entries: number;
  preferences: Record<string, unknown>;
  entries: AnimeEntry[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// In-memory token storage for environments where cross-origin host-only cookies cannot be read by JS
let activeCsrfToken: string | null = null;

export function setActiveCsrfToken(token: string | null): void {
  activeCsrfToken = token;
}

export function getCsrfToken(): string | null {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|;\s*)kage_csrf=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return activeCsrfToken;
}

export async function bootstrapCsrfToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/csrf-token`, {
      method: "GET",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.csrf_token) {
        activeCsrfToken = data.csrf_token;
        return data.csrf_token;
      }
    }
  } catch {
    // Non-fatal, fallback to cookie or active token
  }
  return getCsrfToken();
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  // Attach OWASP session-bound CSRF token for mutating requests
  const method = (options.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && !headers.has("X-CSRF-Token")) {
    let token = getCsrfToken();
    if (!token && typeof window !== "undefined") {
      token = await bootstrapCsrfToken();
    }
    if (token) {
      headers.set("X-CSRF-Token", token);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Enforces sending and receiving HttpOnly session cookies
  });

  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.detail) {
        errorDetail = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      }
    } catch {
      // Non-JSON response
    }
    throw new ApiError(errorDetail, res.status);
  }

  // Handle empty 204 or no-content responses
  if (res.status === 204) {
    return {} as T;
  }

  return (await res.json()) as T;
}

export const authApi = {
  register: (payload: { email: string; password: string; display_name?: string }) =>
    request<User>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  login: async (payload: { email: string; password: string }) => {
    const res = await request<{
      user_id: string;
      email: string;
      display_name?: string;
      message: string;
      csrf_token?: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.csrf_token) {
      setActiveCsrfToken(res.csrf_token);
    }
    return res;
  },

  logout: async () => {
    try {
      return await request<{ message: string }>("/auth/logout", { method: "POST" });
    } finally {
      setActiveCsrfToken(null);
    }
  },

  getMe: () => request<User>("/auth/me"),

  requestPasswordReset: (email: string) =>
    request<{ message: string; detail?: string }>("/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  confirmPasswordReset: (payload: { token: string; new_password: string }) =>
    request<{ message: string }>("/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: { current_password: string; new_password: string }) =>
    request<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const animeApi = {
  list: (params?: {
    status?: AnimeStatus;
    rating?: number;
    is_favorite?: boolean;
    genre?: string;
    q?: string;
    sort_by?: string;
    sort_order?: "asc" | "desc";
    page?: number;
    page_size?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params) {
      if (params.status) sp.set("status", params.status);
      if (params.rating) sp.set("rating", params.rating.toString());
      if (params.is_favorite !== undefined) sp.set("is_favorite", params.is_favorite.toString());
      if (params.genre) sp.set("genre", params.genre);
      if (params.q) sp.set("q", params.q);
      if (params.sort_by) sp.set("sort_by", params.sort_by);
      if (params.sort_order) sp.set("sort_order", params.sort_order);
      if (params.page) sp.set("page", params.page.toString());
      if (params.page_size) sp.set("page_size", params.page_size.toString());
    }
    const queryStr = sp.toString();
    return request<AnimeListResponse>(`/anime${queryStr ? `?${queryStr}` : ""}`);
  },

  get: (id: string) => request<AnimeEntry>(`/anime/${id}`),

  create: (payload: {
    title: string;
    alternate_title?: string;
    poster_url?: string;
    status: AnimeStatus;
    total_episodes?: number;
    watched_episodes?: number;
    rating?: number;
    notes?: string;
    is_favorite?: boolean;
    genres?: string[];
    started_at?: string;
    completed_at?: string;
  }) => request<AnimeEntry>("/anime", { method: "POST", body: JSON.stringify(payload) }),

  update: (
    id: string,
    payload: {
      title?: string;
      alternate_title?: string;
      poster_url?: string;
      status?: AnimeStatus;
      total_episodes?: number;
      watched_episodes?: number;
      rating?: number;
      notes?: string;
      is_favorite?: boolean;
      genres?: string[];
      started_at?: string;
      completed_at?: string;
    }
  ) => request<AnimeEntry>(`/anime/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  updateProgress: (id: string, watched_episodes: number) =>
    request<AnimeEntry>(`/anime/${id}/progress`, {
      method: "PATCH",
      body: JSON.stringify({ watched_episodes }),
    }),

  updateStatus: (id: string, status: AnimeStatus) =>
    request<AnimeEntry>(`/anime/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  toggleFavorite: (id: string) => request<AnimeEntry>(`/anime/${id}/toggle-favorite`, { method: "POST" }),

  delete: (id: string) => request<{ message: string }>(`/anime/${id}`, { method: "DELETE" }),
};

export const statsApi = {
  get: () => request<UserStats>("/stats"),
};

export const accountApi = {
  exportData: () => request<PersonalDataExport>("/account/export"),
  updatePreferences: (prefs: UserPreferences) =>
    request<User>("/account/preferences", { method: "PATCH", body: JSON.stringify(prefs) }),
  deleteAccount: () => request<{ message: string }>("/account", { method: "DELETE" }),
};

export interface CandidateData {
  provider: string;
  provider_id: string;
  title: string;
  canonical_title: string;
  english_title?: string | null;
  romaji_title?: string | null;
  all_titles: string[];
  poster_url?: string | null;
  total_episodes?: number | null;
  status?: string | null;
  media_type?: string | null;
  year?: number | null;
}

export interface ParsedImportRow {
  raw_title: string;
  status: AnimeStatus;
  watched_episodes: number;
  total_episodes?: number | null;
  rating?: number | null;
  notes?: string | null;
}

export interface ParseImportResponse {
  total_rows: number;
  preview_items: ParsedImportRow[];
  errors: string[];
}

export interface ImportJobItem {
  id: string;
  job_id: string;
  raw_title: string;
  parsed_status: AnimeStatus;
  parsed_watched_episodes: number;
  parsed_rating?: number | null;
  parsed_notes?: string | null;
  status: "PENDING" | "MATCHED" | "AMBIGUOUS" | "UNMATCHED" | "DUPLICATE" | "IMPORTED" | "SKIPPED" | "FAILED";
  matched_title?: string | null;
  matched_alternate_title?: string | null;
  provider_media_id?: string | null;
  poster_url?: string | null;
  total_episodes?: number | null;
  match_confidence: number;
  match_warning?: string | null;
  candidates_json: CandidateData[];
  is_duplicate: boolean;
  existing_anime_id?: string | null;
  error_message?: string | null;
}

export interface ImportJob {
  id: string;
  user_id: string;
  source_type: string;
  status: "PENDING" | "PROCESSING" | "REVIEW" | "COMPLETED" | "FAILED" | "CANCELLED";
  total_items: number;
  matched_items: number;
  imported_items: number;
  skipped_items: number;
  failed_items: number;
  items: ImportJobItem[];
  created_at: string;
  updated_at: string;
}

export interface MetadataRefreshResponse {
  anime_id: string;
  title: string;
  provider: string;
  provider_media_id?: string | null;
  previous_total_episodes?: number | null;
  updated_total_episodes?: number | null;
  status: string;
  message: string;
}

export const importApi = {
  parse: (text_content: string, file_type: "text" | "csv" = "text") =>
    request<ParseImportResponse>("/import/parse", {
      method: "POST",
      body: JSON.stringify({ text_content, file_type }),
    }),

  createJob: (source_type: string, items: ParsedImportRow[]) =>
    request<ImportJob>("/import/jobs", {
      method: "POST",
      body: JSON.stringify({ source_type, items }),
    }),

  getJob: (job_id: string) =>
    request<ImportJob>(`/import/jobs/${job_id}`),

  updateItem: (
    job_id: string,
    item_id: string,
    payload: {
      selected_provider_id?: string;
      user_title?: string;
      user_status?: AnimeStatus;
      watched_episodes?: number;
      total_episodes?: number;
      rating?: number;
      skip?: boolean;
    }
  ) =>
    request<ImportJobItem>(`/import/jobs/${job_id}/items/${item_id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  confirmJob: (job_id: string, actions: Record<string, "skip" | "update_metadata" | "merge_progress">) =>
    request<ImportJob>(`/import/jobs/${job_id}/confirm`, {
      method: "POST",
      body: JSON.stringify({ actions }),
    }),

  cancelJob: (job_id: string) =>
    request<ImportJob>(`/import/jobs/${job_id}/cancel`, {
      method: "POST",
    }),
};

export const refreshApi = {
  refreshAnime: (anime_id: string) =>
    request<MetadataRefreshResponse>(`/anime/${anime_id}/refresh`, {
      method: "POST",
    }),
};

