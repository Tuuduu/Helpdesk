"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, Mail, Headphones, Building2, User } from "lucide-react";
import { api } from "@/lib/api";
import { getInitials } from "@/lib/utils";

interface EngineerInfo {
  id: string;
  fullName: string;
  position?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
}

interface VendorInfo {
  id: string;
  vendorTypeName: string;
  companyName: string;
  accountManager?: string;
  phone?: string;
  email?: string;
  description?: string;
}

interface ContactsResponse {
  engineers: EngineerInfo[];
  vendors: VendorInfo[];
}

export function LoginContacts() {
  const [data, setData] = useState<ContactsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ContactsResponse>("/public/contacts")
      .then((res) => {
        if (res.success && res.data) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!data || (data.engineers.length === 0 && data.vendors.length === 0)) {
    return null;
  }

  return (
    <div className="mt-10 space-y-8 animate-fade-in">
      {/* Engineers section */}
      {data.engineers.length > 0 && (
        <section>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Headphones className="w-5 h-5 text-white/80" />
            <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">
              МТ-ийн дуудлагын инженерүүд
            </h2>
          </div>
          <MarqueeRow
            speed={Math.max(40, 90 - data.engineers.length * 4)}
            items={data.engineers.map((e) => (
              <EngineerCard key={e.id} engineer={e} />
            ))}
          />
        </section>
      )}

      {/* Vendors section */}
      {data.vendors.length > 0 && (
        <section>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-white/80" />
            <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">
              Харилцагч компаниудын лавлах
            </h2>
          </div>
          <MarqueeRow
            speed={Math.max(35, 75 - data.vendors.length * 3)}
            reverse
            items={data.vendors.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          />
        </section>
      )}
    </div>
  );
}

// ── Marquee row (infinite horizontal scroll, hover-pause, draggable) ──

function MarqueeRow({
  items,
  speed = 60,
  reverse = false,
}: {
  items: React.ReactNode[];
  /** Pixels per second */
  speed?: number;
  reverse?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const halfWidthRef = useRef(0);
  const isHoveringRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, offset: 0 });
  const movedRef = useRef(0);

  // Measure half-width (one copy of items) for seamless wrap-around.
  useEffect(() => {
    if (!trackRef.current) return;
    const measure = () => {
      if (!trackRef.current) return;
      halfWidthRef.current = trackRef.current.scrollWidth / 2;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [items.length]);

  // Animation loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      const w = halfWidthRef.current;
      if (
        w > 0 &&
        !isHoveringRef.current &&
        !isDraggingRef.current &&
        trackRef.current
      ) {
        const direction = reverse ? 1 : -1;
        offsetRef.current += direction * speed * dt;
        offsetRef.current = wrap(offsetRef.current, w);
        trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reverse, speed]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    movedRef.current = 0;
    dragStartRef.current = { x: e.clientX, offset: offsetRef.current };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    movedRef.current = Math.max(movedRef.current, Math.abs(dx));
    const w = halfWidthRef.current;
    offsetRef.current = w > 0 ? wrap(dragStartRef.current.offset + dx, w) : dragStartRef.current.offset + dx;
    trackRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // If user dragged more than 4px, swallow click on inner links.
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (movedRef.current > 4) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = 0;
    }
  };

  return (
    <div
      className="relative overflow-hidden marquee-mask select-none cursor-grab active:cursor-grabbing"
      onMouseEnter={() => (isHoveringRef.current = true)}
      onMouseLeave={() => (isHoveringRef.current = false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
    >
      <div
        ref={trackRef}
        className="flex gap-4 w-max"
        style={{ willChange: "transform" }}
      >
        {/* Duplicate the list for seamless looping */}
        {[...items, ...items].map((item, i) => (
          <div key={i} className="shrink-0 pointer-events-auto">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function wrap(value: number, halfWidth: number): number {
  // Keep offset within (-halfWidth, 0] so the duplicated track loops seamlessly.
  while (value <= -halfWidth) value += halfWidth;
  while (value > 0) value -= halfWidth;
  return value;
}

// ── Cards ──────────────────────────────────────────────────────────

function EngineerCard({ engineer: e }: { engineer: EngineerInfo }) {
  return (
    <div className="w-72 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl p-4 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-full bg-white/20 text-white flex items-center justify-center text-sm font-bold ring-2 ring-white/10 shrink-0">
          {getInitials(e.fullName)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {e.fullName}
          </p>
          {e.position && (
            <p className="text-xs text-white/60 truncate">{e.position}</p>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        {e.phone && (
          <a
            href={`tel:${e.phone}`}
            className="flex items-center gap-2 text-xs text-white/85 hover:text-white"
          >
            <Phone className="w-3.5 h-3.5 text-white/50" />
            <span className="font-mono">{e.phone}</span>
          </a>
        )}
        {e.email && (
          <a
            href={`mailto:${e.email}`}
            className="flex items-center gap-2 text-xs text-white/85 hover:text-white truncate"
          >
            <Mail className="w-3.5 h-3.5 text-white/50 shrink-0" />
            <span className="truncate">{e.email}</span>
          </a>
        )}
      </div>
    </div>
  );
}

function VendorCard({ vendor: v }: { vendor: VendorInfo }) {
  return (
    <div className="w-80 bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl p-4 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-white/50 mb-0.5">
            {v.vendorTypeName}
          </p>
          <p className="text-sm font-semibold text-white truncate">
            {v.companyName}
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        {v.accountManager && (
          <div className="flex items-center gap-2 text-xs text-white/85">
            <User className="w-3.5 h-3.5 text-white/50" />
            <span className="truncate">{v.accountManager}</span>
          </div>
        )}
        {v.phone && (
          <a
            href={`tel:${v.phone}`}
            className="flex items-center gap-2 text-xs text-white/85 hover:text-white"
          >
            <Phone className="w-3.5 h-3.5 text-white/50" />
            <span className="font-mono">{v.phone}</span>
          </a>
        )}
        {v.email && (
          <a
            href={`mailto:${v.email}`}
            className="flex items-center gap-2 text-xs text-white/85 hover:text-white truncate"
          >
            <Mail className="w-3.5 h-3.5 text-white/50 shrink-0" />
            <span className="truncate">{v.email}</span>
          </a>
        )}
        {v.description && (
          <p className="text-[11px] text-white/60 mt-2 pt-2 border-t border-white/10 line-clamp-2">
            {v.description}
          </p>
        )}
      </div>
    </div>
  );
}
