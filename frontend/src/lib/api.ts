import type { ApiResponse } from "@/types/api";

// Default to a relative path so the frontend works on any domain (same-origin via nginx).
// Set NEXT_PUBLIC_API_URL only when API runs on a different host (e.g. dev with split ports).
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

let accessToken: string | null = null;
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const base = `${API_URL}${path}`;
  if (!params) return base;
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      sp.append(key, String(value));
    }
  });
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    localStorage.removeItem("refreshToken");
    document.cookie = "has-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    throw new Error("Refresh failed");
  }

  const data: ApiResponse<{ accessToken: string; refreshToken: string }> =
    await response.json();

  if (!data.success || !data.data) {
    throw new Error("Refresh failed");
  }

  setAccessToken(data.data.accessToken);
  localStorage.setItem("refreshToken", data.data.refreshToken);
  document.cookie = "has-auth=true; path=/; SameSite=Lax";
  return data.data.accessToken;
}

async function handleTokenRefresh(): Promise<string> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const token = await refreshAccessToken();
    refreshQueue.forEach((q) => q.resolve(token));
    return token;
  } catch (error) {
    refreshQueue.forEach((q) => q.reject(error as Error));
    throw error;
  } finally {
    isRefreshing = false;
    refreshQueue = [];
  }
}

async function request<T>(
  method: string,
  path: string,
  options?: {
    data?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
    responseType?: "json" | "blob";
  }
): Promise<ApiResponse<T>> {
  const url = buildUrl(path, options?.params);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, {
    method,
    headers,
    body: options?.data ? JSON.stringify(options.data) : undefined,
  });

  // Handle 401 — attempt refresh (also when accessToken is null after page refresh)
  const hasRefreshToken = typeof window !== "undefined" && !!localStorage.getItem("refreshToken");
  if (response.status === 401 && (accessToken || hasRefreshToken)) {
    try {
      const newToken = await handleTokenRefresh();
      headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(url, {
        method,
        headers,
        body: options?.data ? JSON.stringify(options.data) : undefined,
      });
    } catch {
      document.cookie = "has-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      window.location.href = "/login";
      return { success: false, data: null, message: "Session expired", errors: [] };
    }
  }

  if (options?.responseType === "blob") {
    if (!response.ok) {
      return { success: false, data: null, message: "Файл татахад алдаа гарлаа", errors: [] };
    }
    const blob = await response.blob();
    return { success: true, data: blob as unknown as T, message: null, errors: [] };
  }

  const text = await response.text();
  if (!text) {
    return { success: false, data: null, message: "Empty response", errors: [] };
  }
  const json: ApiResponse<T> = JSON.parse(text);
  return json;
}

export const api = {
  get: <T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ) => request<T>("GET", path, { params }),

  post: <T>(path: string, data?: unknown) =>
    request<T>("POST", path, { data }),

  put: <T>(path: string, data?: unknown) =>
    request<T>("PUT", path, { data }),

  patch: <T>(path: string, data?: unknown) =>
    request<T>("PATCH", path, { data }),

  delete: <T>(path: string) => request<T>("DELETE", path),

  download: (
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ) => request<Blob>("GET", path, { params, responseType: "blob" }),
};
