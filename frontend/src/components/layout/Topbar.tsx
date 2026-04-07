"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, Bell, X, Ticket, CheckCheck } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { UserMenu } from "./UserMenu";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { PagedResult } from "@/types/api";

// ── Types ──────────────────────────────────────────────────────────

interface TicketSearchResult {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  companyName: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedTicketId?: string;
  ticketNumber?: string;
  createdAt: string;
}

// ── Topbar ─────────────────────────────────────────────────────────

export function Topbar() {
  const { openMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-topbar h-16 flex items-center justify-between px-6 glass border-b border-white/10 rounded-none">
      <div className="flex items-center gap-4">
        <button
          onClick={openMobile}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 md:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <SearchBar />
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}

// ── Search ─────────────────────────────────────────────────────────

function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TicketSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await api.get<PagedResult<TicketSearchResult>>("/tickets", {
        search: query.trim(),
        pageSize: 6,
        page: 1,
      });
      if (res.success && res.data) {
        setResults(res.data.items);
        setOpen(true);
      }
      setLoading(false);
    }, 300);
  }, [query]);

  const goTo = (id: string) => {
    router.push(`/tickets/${id}`);
    setQuery("");
    setOpen(false);
  };

  const STATUS_COLORS: Record<string, string> = {
    New: "bg-blue-100 text-blue-700",
    Accepted: "bg-amber-100 text-amber-700",
    InProgress: "bg-purple-100 text-purple-700",
    Closed: "bg-green-100 text-green-700",
  };
  const STATUS_LABELS: Record<string, string> = {
    New: "Шинэ", Accepted: "Хүлээн авсан", InProgress: "Шийдвэрлэж байна", Closed: "Хаагдсан",
  };

  return (
    <div className="relative hidden sm:block" ref={containerRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        placeholder="Тикет хайх..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setOpen(false); setQuery(""); }
          if (e.key === "Enter" && results[0]) goTo(results[0].id);
        }}
        className="input-glass pl-10 pr-8 w-72 py-2 text-sm"
      />
      {query && (
        <button
          onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {open && (
        <div className="absolute top-full left-0 mt-2 w-96 glass-elevated py-1 animate-scale-in origin-top-left" style={{ zIndex: 9999 }}>
          {loading && (
            <div className="px-4 py-3 text-xs text-gray-400">Хайж байна...</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-xs text-gray-400">Тикет олдсонгүй</div>
          )}
          {!loading && results.map((r) => (
            <button
              key={r.id}
              onClick={() => goTo(r.id)}
              className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-white/40 transition-colors text-left"
            >
              <Ticket className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">{r.ticketNumber}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                </div>
                <p className="text-sm text-gray-700 truncate mt-0.5">{r.title}</p>
                <p className="text-xs text-gray-400">{r.companyName}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Notification Bell ───────────────────────────────────────────────

function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    const res = await api.get<number>("/notifications/unread-count");
    if (res.success && res.data !== undefined) setUnreadCount(res.data);
  }, []);

  const fetchNotifications = useCallback(async () => {
    const res = await api.get<NotificationItem[]>("/notifications");
    if (res.success && res.data) setNotifications(res.data);
  }, []);

  // Poll unread count every 30s
  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    if (!open) await fetchNotifications();
    setOpen(!open);
  };

  const markAllRead = async () => {
    await api.patch("/notifications/read-all", {});
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      await api.patch(`/notifications/${n.id}/read`, {});
      setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, isRead: true } : item));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (n.relatedTicketId) {
      router.push(`/tickets/${n.relatedTicketId}`);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-white/40 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 glass-elevated animate-scale-in origin-top-right overflow-hidden" style={{ zIndex: 9999 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Мэдэгдэл</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Бүгдийг уншсан
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-gray-400">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs">Мэдэгдэл байхгүй</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 transition-colors hover:bg-white/40 ${
                    !n.isRead ? "bg-primary/4" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? "bg-primary" : "bg-gray-200"}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
