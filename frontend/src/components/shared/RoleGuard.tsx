"use client";

import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/lib/constants";

interface RoleGuardProps {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { role, isLoading } = useAuth();

  if (isLoading) return null;
  if (!role || !roles.includes(role)) return <>{fallback}</>;

  return <>{children}</>;
}
