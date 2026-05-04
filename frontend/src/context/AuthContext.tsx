"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { AuthUser, LoginRequest } from "@/types/auth";
import type { UserRole } from "@/lib/constants";
import { loginUser, logoutUser, getProfile, hasRefreshToken } from "@/lib/auth";
import { setAccessToken } from "@/lib/api";

function clearAuthCookie() {
  document.cookie = "has-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    credentials: LoginRequest
  ) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
        setAccessToken(null);
        clearAuthCookie();
      }
    } catch {
      setUser(null);
      setAccessToken(null);
      clearAuthCookie();
    }
  }, []);

  // Initialize: check if we have a stored session
  useEffect(() => {
    async function init() {
      if (hasRefreshToken()) {
        await refreshUser();
      }
      setIsLoading(false);
    }
    init();
  }, [refreshUser]);

  const login = async (credentials: LoginRequest) => {
    const response = await loginUser(credentials);
    if (response.success && response.data) {
      setUser(response.data.user);
      return { success: true, role: response.data.user.role };
    }
    return {
      success: false,
      error: response.errors?.[0] || response.message || "Нэвтрэх амжилтгүй",
    };
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  const { user } = context;

  return {
    ...context,
    role: (user?.role ?? null) as UserRole | null,
    isSuperAdmin: user?.role === "SuperAdmin",
    isAdmin: user?.role === "Admin",
    isAdminOrAbove: user?.role === "SuperAdmin" || user?.role === "Admin",
    isUser: user?.role === "User",
    isITStorekeeper: user?.role === "ITStorekeeper",
    isStorekeeperOrAbove:
      user?.role === "SuperAdmin" || user?.role === "ITStorekeeper",
  };
}
