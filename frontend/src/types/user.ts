import type { UserRole } from "@/lib/constants";
import type { PagedRequest } from "./api";

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  companyId: string;
  companyName: string;
  departmentId?: string;
  departmentName?: string;
  position?: string;
  phoneNumber?: string;
  computerNumber?: string;
  role: UserRole;
  avatarUrl?: string;
  isActive: boolean;
  isGlobalApprover: boolean;
  showOnLoginPage: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  companyId: string;
  departmentId?: string;
  position?: string;
  phoneNumber?: string;
  computerNumber?: string;
  role: UserRole;
  isGlobalApprover?: boolean;
}

export interface UpdateUserRequest {
  fullName?: string;
  companyId?: string;
  departmentId?: string;
  position?: string;
  phoneNumber?: string;
  computerNumber?: string;
  role?: UserRole;
  isActive?: boolean;
  isGlobalApprover?: boolean;
  showOnLoginPage?: boolean;
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
  departmentId?: string | null;
  position?: string;
  phoneNumber?: string;
  computerNumber?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
