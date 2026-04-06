"use client";

import { cn } from "@/lib/utils";

interface GlassPanelProps {
  variant?: "default" | "elevated" | "subtle" | "dark";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  default: "glass",
  elevated: "glass-elevated",
  subtle: "glass-subtle",
  dark: "glass-dark",
};

const paddingClasses: Record<string, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

export function GlassPanel({
  variant = "default",
  padding = "md",
  className,
  children,
}: GlassPanelProps) {
  return (
    <div className={cn(variantClasses[variant], paddingClasses[padding], className)}>
      {children}
    </div>
  );
}
