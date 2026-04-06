"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SidebarItemProps {
  label: string;
  path: string;
  icon: LucideIcon;
  collapsed?: boolean;
}

export function SidebarItem({
  label,
  path,
  icon: Icon,
  collapsed = false,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive =
    pathname === path ||
    (path !== "/" &&
      pathname.startsWith(path + "/") &&
      // Don't highlight parent "/tickets" when on a more specific sibling like "/tickets/create"
      !pathname.startsWith(path + "/create"));

  return (
    <Link
      href={path}
      className={cn("sidebar-item", isActive && "active")}
      title={collapsed ? label : undefined}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
