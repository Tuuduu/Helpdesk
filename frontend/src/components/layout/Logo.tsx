"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useBranding } from "@/context/BrandingContext";

interface LogoProps {
  variant?: "full" | "icon";
  theme?: "light" | "dark";
  className?: string;
}

export function Logo({ variant = "full", theme = "dark", className }: LogoProps) {
  const { companyName, companySubtitle, logoText } = useBranding();

  return (
    <Link href="/dashboard" className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-xl font-bold shrink-0",
          "w-10 h-10 text-sm",
          theme === "dark" ? "bg-white/10 text-white" : "bg-primary/10 text-primary"
        )}
      >
        {logoText || "BG"}
      </div>
      {variant === "full" && (
        <div className="flex flex-col">
          <span className={cn("text-sm font-bold leading-tight", theme === "dark" ? "text-white" : "text-gray-900")}>
            {companyName || "BISHRELT"}
          </span>
          <span className={cn("text-[10px] font-medium leading-tight tracking-wider", theme === "dark" ? "text-white/50" : "text-gray-400")}>
            {companySubtitle || "GROUP"}
          </span>
        </div>
      )}
    </Link>
  );
}
