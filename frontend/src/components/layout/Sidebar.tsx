"use client";

import { cn } from "@/lib/utils";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { SIDEBAR_NAV } from "@/lib/constants";
import { Logo } from "./Logo";
import { SidebarItem } from "./SidebarItem";

export function Sidebar() {
  const { isCollapsed, toggleCollapse } = useSidebar();
  const { role } = useAuth();

  const visibleItems = SIDEBAR_NAV.filter(
    (item) => role && item.roles.includes(role)
  );

  const mainItems = visibleItems.filter(
    (item) => item.path !== "/about" && item.path !== "/profile"
  );
  const bottomItems = visibleItems.filter(
    (item) => item.path === "/about" || item.path === "/profile"
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-sidebar flex-col glass-dark hidden md:flex transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-16 border-b border-white/5",
          isCollapsed ? "justify-center px-2" : "px-5"
        )}
      >
        <Logo variant={isCollapsed ? "icon" : "full"} theme="dark" />
      </div>

      {/* Main navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
        {mainItems.map((item) => (
          <SidebarItem
            key={item.path}
            label={item.label}
            path={item.path}
            icon={item.icon}
            collapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/5 px-3 py-3 space-y-1">
        {bottomItems.map((item) => (
          <SidebarItem
            key={item.path}
            label={item.label}
            path={item.path}
            icon={item.icon}
            collapsed={isCollapsed}
          />
        ))}

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="sidebar-item w-full"
          title={isCollapsed ? "Дэлгэх" : "Хураах"}
        >
          {isCollapsed ? (
            <ChevronsRight className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="w-5 h-5 shrink-0" />
              <span className="truncate">Хураах</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
