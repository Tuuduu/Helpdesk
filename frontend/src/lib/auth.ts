import { api, setAccessToken } from "./api";
import type { LoginRequest, LoginResponse, AuthUser, RegisterRequest } from "@/types/auth";
import type { ApiResponse } from "@/types/api";

function setAuthCookie(value: boolean) {
  if (typeof document === "undefined") return;
  if (value) {
    document.cookie = "has-auth=true; path=/; SameSite=Lax";
  } else {
    document.cookie = "has-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

export async function loginUser(
  credentials: LoginRequest
): Promise<ApiResponse<LoginResponse>> {
  const response = await api.post<LoginResponse>("/auth/login", credentials);

  if (response.success && response.data) {
    setAccessToken(response.data.accessToken);
    localStorage.setItem("refreshToken", response.data.refreshToken);
    setAuthCookie(true);
  }

  return response;
}

export async function registerUser(
  data: RegisterRequest
): Promise<ApiResponse<LoginResponse>> {
  const response = await api.post<LoginResponse>("/auth/register", data);

  if (response.success && response.data) {
    setAccessToken(response.data.accessToken);
    localStorage.setItem("refreshToken", response.data.refreshToken);
    setAuthCookie(true);
  }

  return response;
}

export async function logoutUser(): Promise<void> {
  const refreshToken = localStorage.getItem("refreshToken");
  try {
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken });
    }
  } finally {
    setAccessToken(null);
    localStorage.removeItem("refreshToken");
    setAuthCookie(false);
  }
}

export async function getProfile(): Promise<ApiResponse<AuthUser>> {
  return api.get<AuthUser>("/profile");
}

export function hasRefreshToken(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("refreshToken");
}
