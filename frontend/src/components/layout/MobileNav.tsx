"use client";

import { X } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { SIDEBAR_NAV } from "@/lib/constants";
import { Logo } from "./Logo";
import { SidebarItem } from "./SidebarItem";

export function MobileNav() {
  const { isMobileOpen, closeMobile } = useSidebar();
  const { role } = useAuth();

  if (!isMobileOpen) return null;

  const visibleItems = SIDEBAR_NAV.filter(
    (item) => role && item.roles.includes(role)
  );

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={closeMobile}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 left-0 w-72 glass-dark animate-slide-in-left">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/5">
          <Logo variant="full" theme="dark" />
          <button
            onClick={closeMobile}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1">
          {visibleItems.map((item) => (
            <div key={item.path} onClick={closeMobile}>
              <SidebarItem
                label={item.label}
                path={item.path}
                icon={item.icon}
              />
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
