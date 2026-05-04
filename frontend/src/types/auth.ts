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
  departmentId?: string;
  departmentName?: string;
  position?: string;
  phoneNumber?: string;
  computerNumber?: string;
  avatarUrl?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  companyId: string;
  departmentId?: string;
  position?: string;
  phoneNumber?: string;
  computerNumber?: string;
}
