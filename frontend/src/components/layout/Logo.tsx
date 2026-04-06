"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon";
  theme?: "light" | "dark";
  className?: string;
}

export function Logo({
  variant = "full",
  theme = "dark",
  className,
}: LogoProps) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-3", className)}>
      {/* Placeholder: replace with actual logo images */}
      <div
        className={cn(
          "flex items-center justify-center rounded-xl font-bold",
          variant === "icon" ? "w-10 h-10 text-sm" : "w-10 h-10 text-sm",
          theme === "dark"
            ? "bg-white/10 text-white"
            : "bg-primary/10 text-primary"
        )}
      >
        BG
      </div>
      {variant === "full" && (
        <div className="flex flex-col">
          <span
            className={cn(
              "text-sm font-bold leading-tight",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            BISHRELT
          </span>
          <span
            className={cn(
              "text-[10px] font-medium leading-tight tracking-wider",
              theme === "dark" ? "text-white/50" : "text-gray-400"
            )}
          >
            GROUP
          </span>
        </div>
      )}
    </Link>
  );
}
