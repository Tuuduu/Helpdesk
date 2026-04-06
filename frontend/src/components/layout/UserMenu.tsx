"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, UserCircle, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-white/40 transition-colors"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
          {getInitials(user.fullName)}
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {user.fullName}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-60 glass-elevated p-2 animate-scale-in origin-top-right">
          {/* User info */}
          <div className="px-3 py-2.5 border-b border-gray-100 mb-1">
            <p className="text-sm font-semibold text-gray-900">
              {user.fullName}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
            <Badge variant="info" size="sm" className="mt-1.5">
              {USER_ROLE_LABELS[user.role]}
            </Badge>
          </div>

          {/* Menu items */}
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <UserCircle className="w-4 h-4" />
            Профайл
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Гарах
          </button>
        </div>
      )}
    </div>
  );
}
