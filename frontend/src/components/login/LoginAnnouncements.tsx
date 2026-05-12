"use client";

import { useEffect, useState } from "react";
import {
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Megaphone,
} from "lucide-react";
import type { PublicAnnouncement, AnnouncementLevel } from "@/types/announcement";

const LEVEL_THEME: Record<
  AnnouncementLevel,
  {
    bg: string;
    ring: string;
    iconBg: string;
    iconColor: string;
    title: string;
    body: string;
    pill: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }
> = {
  info: {
    bg: "from-sky-400/20 via-sky-300/10 to-blue-400/20",
    ring: "ring-sky-300/30",
    iconBg: "bg-sky-500/20",
    iconColor: "text-sky-200",
    title: "text-white",
    body: "text-sky-50/85",
    pill: "bg-sky-500/20 text-sky-100 ring-1 ring-sky-300/30",
    icon: Info,
    label: "Мэдээлэл",
  },
  warning: {
    bg: "from-amber-400/25 via-orange-300/15 to-amber-500/25",
    ring: "ring-amber-300/40",
    iconBg: "bg-amber-500/25",
    iconColor: "text-amber-100",
    title: "text-white",
    body: "text-amber-50/90",
    pill: "bg-amber-500/25 text-amber-100 ring-1 ring-amber-300/40",
    icon: AlertTriangle,
    label: "Анхааруулга",
  },
  success: {
    bg: "from-emerald-400/20 via-green-300/10 to-emerald-500/20",
    ring: "ring-emerald-300/30",
    iconBg: "bg-emerald-500/25",
    iconColor: "text-emerald-100",
    title: "text-white",
    body: "text-emerald-50/85",
    pill: "bg-emerald-500/25 text-emerald-100 ring-1 ring-emerald-300/30",
    icon: CheckCircle2,
    label: "Амжилт",
  },
  danger: {
    bg: "from-rose-400/25 via-pink-300/15 to-red-400/25",
    ring: "ring-rose-300/30",
    iconBg: "bg-rose-500/25",
    iconColor: "text-rose-100",
    title: "text-white",
    body: "text-rose-50/90",
    pill: "bg-rose-500/25 text-rose-100 ring-1 ring-rose-300/30",
    icon: XCircle,
    label: "Чухал",
  },
};

export function LoginAnnouncements({ items }: { items: PublicAnnouncement[] }) {
  const [index, setIndex] = useState(0);

  // Auto-rotate when multiple announcements
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, 9000);
    return () => clearInterval(id);
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[index % items.length];
  const theme = LEVEL_THEME[current.level] ?? LEVEL_THEME.info;
  const Icon = theme.icon;

  return (
    <div className="animate-fade-in">
      <div
        key={current.id}
        className={`relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br ${theme.bg} backdrop-blur-md p-5 ring-1 ${theme.ring} shadow-lg shadow-black/10 transition-all duration-500`}
      >
        {/* Decorative megaphone watermark */}
        <Megaphone className="absolute -right-3 -top-3 w-24 h-24 text-white/5 rotate-12 pointer-events-none" />

        <div className="relative flex items-start gap-3">
          <div
            className={`shrink-0 w-10 h-10 rounded-xl ${theme.iconBg} ${theme.iconColor} flex items-center justify-center ring-1 ring-white/20`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${theme.pill}`}
              >
                {theme.label}
              </span>
              <h3 className={`text-sm sm:text-base font-semibold ${theme.title}`}>
                {current.title}
              </h3>
            </div>
            <p
              className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${theme.body}`}
            >
              {current.body}
            </p>
          </div>
        </div>

        {/* Carousel controls when multiple */}
        {items.length > 1 && (
          <div className="relative flex items-center justify-between mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index
                      ? "w-6 bg-white/80"
                      : "w-1.5 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Мэдэгдэл ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setIndex((i) => (i - 1 + items.length) % items.length)
                }
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Өмнөх"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIndex((i) => (i + 1) % items.length)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Дараах"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
