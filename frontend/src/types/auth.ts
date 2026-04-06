import type { UserRole } from "@/lib/constants";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  position?: string;
  phoneNumber?: string;
  computerNumber?: string;
  avatarUrl?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
