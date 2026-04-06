import type { UserRole } from "@/lib/constants";
import type { PagedRequest } from "./api";

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  companyId: string;
  companyName: string;
  position?: string;
  phoneNumber?: string;
  computerNumber?: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  companyId: string;
  position?: string;
  phoneNumber?: string;
  computerNumber?: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  fullName?: string;
  companyId?: string;
  position?: string;
  phoneNumber?: string;
  computerNumber?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserFilterRequest extends PagedRequest {
  companyId?: string;
  role?: UserRole;
  search?: string;
  isActive?: boolean;
}

export interface CompanyGroupedUsers {
  companyId: string;
  companyName: string;
  users: UserResponse[];
}

export interface UpdateProfileRequest {
  fullName?: string;
  position?: string;
  phoneNumber?: string;
  computerNumber?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
