"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  label?: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
}

export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Сонгох...",
  emptyMessage = "Илэрц олдсонгүй",
  disabled = false,
  required = false,
  helperText,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Need this for SSR — only render portal after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.sublabel?.toLowerCase().includes(q) ?? false)
    );
  }, [options, query]);

  // Position the panel below the trigger using viewport coords
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const updatePos = () => {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  // Focus search input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
    else setQuery("");
  }, [open]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const panel = open && mounted ? (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 9999,
      }}
      className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
    >
      <div className="p-2 border-b border-gray-100 bg-gray-50">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Хайх..."
            className="w-full pl-8 pr-2 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto py-1 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-gray-400">
            {emptyMessage}
          </div>
        ) : (
          filtered.map((opt) => {
            const isSel = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm flex items-start gap-2 hover:bg-gray-50 transition-colors",
                  isSel && "bg-primary/5"
                )}
              >
                <Check
                  className={cn(
                    "w-4 h-4 mt-0.5 shrink-0",
                    isSel ? "text-primary" : "text-transparent"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "truncate",
                      isSel ? "text-primary font-medium" : "text-gray-900"
                    )}
                  >
                    {opt.label}
                  </div>
                  {opt.sublabel && (
                    <div className="text-xs text-gray-400 truncate">
                      {opt.sublabel}
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "input-glass flex items-center justify-between text-left w-full",
          disabled && "opacity-60 cursor-not-allowed",
          !selected && "text-gray-400"
        )}
      >
        <span className="truncate">
          {selected ? (
            <>
              <span className="text-gray-900">{selected.label}</span>
              {selected.sublabel && (
                <span className="text-gray-400 ml-2 text-xs">
                  {selected.sublabel}
                </span>
              )}
            </>
          ) : (
            placeholder
          )}
        </span>
        <span className="flex items-center gap-1 ml-2 shrink-0">
          {selected && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
              aria-label="Цэвэрлэх"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform",
              open && "rotate-180"
            )}
          />
        </span>
      </button>

      {helperText && <p className="text-xs text-gray-400">{helperText}</p>}

      {mounted && panel ? createPortal(panel, document.body) : null}
    </div>
  );
}
