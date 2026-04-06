"use client";

import { Menu, Search, Bell } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { UserMenu } from "./UserMenu";

export function Topbar() {
  const { openMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-topbar h-16 flex items-center justify-between px-6 glass border-b border-white/10 rounded-none">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={openMobile}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 md:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Хайх..."
            className="input-glass pl-10 w-64 py-2 text-sm"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
}
