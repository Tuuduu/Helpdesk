"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  title?: string;
  value?: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  className?: string;
  children?: React.ReactNode;
}

export function Card({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  children,
}: CardProps) {
  return (
    <div className={cn("glass glass-hover p-5", className)}>
      {/* Stat card mode */}
      {value !== undefined ? (
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {title && (
              <p className="text-sm font-medium text-gray-500">{title}</p>
            )}
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend.value >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {trend.value >= 0 ? "+" : ""}
                {trend.value}% {trend.label}
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-gray-400">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="p-2.5 rounded-glass-sm bg-primary-50 text-primary">
              {icon}
            </div>
          )}
        </div>
      ) : (
        /* Content card mode */
        <>
          {title && (
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                {title}
              </h3>
              {icon && <div className="text-gray-400">{icon}</div>}
            </div>
          )}
          {children}
        </>
      )}
    </div>
  );
}
