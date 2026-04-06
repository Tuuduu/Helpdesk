"use client";

import { Inbox } from "lucide-react";

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  message = "Мэдээлэл олдсонгүй",
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      {icon || <Inbox className="w-12 h-12 mb-3 opacity-40" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}
