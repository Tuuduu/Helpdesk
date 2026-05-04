"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Monitor,
  Wrench,
  ArrowLeftRight,
  Archive,
  Cpu,
  Calendar,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel, Button, Spinner } from "@/components/ui";
import type { ComputerDashboardResponse } from "@/types/computer";

const PIE_COLORS = [
  "#2D2C70",
  "#6b5fff",
  "#8b7fff",
  "#a99fff",
  "#c4bfff",
  "#d4cfff",
];

export default function ComputersDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<ComputerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await api.get<ComputerDashboardResponse>(
        "/computers/dashboard"
      );
      if (res.success && res.data) setData(res.data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!data) return null;

  const statusData = [
    { name: "Идэвхтэй", value: data.activeCount, color: "#10b981" },
    { name: "Засварт", value: data.inRepairCount, color: "#f59e0b" },
    { name: "Шилжиж буй", value: data.inTransferCount, color: "#6b5fff" },
    { name: "Хасагдсан", value: data.retiredCount, color: "#9ca3af" },
  ].filter((s) => s.value > 0);

  return (
    <>
      <PageHeader
        title="Компьютер · Хянах самбар"
        description="Хөрөнгийн ерөнхий статистик"
        actions={
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.push("/computers")}
          >
            Жагсаалт руу
          </Button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          icon={<Monitor className="w-5 h-5" />}
          label="Нийт"
          value={data.totalCount}
          color="from-primary to-primary-700"
        />
        <KpiCard
          icon={<Monitor className="w-5 h-5" />}
          label="Идэвхтэй"
          value={data.activeCount}
          color="from-green-500 to-green-700"
        />
        <KpiCard
          icon={<Wrench className="w-5 h-5" />}
          label="Засварт"
          value={data.inRepairCount}
          color="from-amber-500 to-amber-700"
        />
        <KpiCard
          icon={<ArrowLeftRight className="w-5 h-5" />}
          label="Шилжиж буй"
          value={data.inTransferCount}
          color="from-purple-500 to-purple-700"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MiniStat
          icon={<Cpu className="w-4 h-4" />}
          label="Дундаж RAM"
          value={`${data.averageRamGb} GB`}
        />
        <MiniStat
          icon={<Calendar className="w-4 h-4" />}
          label="Дундаж нас"
          value={`${Math.round(data.averageAgeDays)} хоног`}
        />
        <MiniStat
          icon={<TrendingUp className="w-4 h-4" />}
          label="30 хоногийн шилжүүлэг"
          value={data.transfersLast30Days}
        />
        <MiniStat
          icon={<Archive className="w-4 h-4" />}
          label="Хасагдсан"
          value={data.retiredCount}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status pie */}
        <GlassPanel>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Төлөв тус бүрийн хуваарилалт
          </h3>
          {statusData.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-10 text-center">
              Өгөгдөл алга
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </GlassPanel>

        {/* Brand bars */}
        <GlassPanel>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Брэнд тус бүр
          </h3>
          {data.byBrand.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-10 text-center">
              Өгөгдөл алга
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byBrand.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6b5fff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </GlassPanel>

        {/* Per company */}
        <GlassPanel className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Компани тус бүр
          </h3>
          {data.byCompany.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-10 text-center">
              Өгөгдөл алга
            </p>
          ) : (
            <div className="space-y-2">
              {data.byCompany.map((c, i) => {
                const max = Math.max(...data.byCompany.map((x) => x.count));
                const pct = (c.count / max) * 100;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-40 truncate">
                      {c.name}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-10 text-right">
                      {c.count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </GlassPanel>
      </div>
    </>
  );
}

function KpiCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <GlassPanel padding="md">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} text-white flex items-center justify-center`}
        >
          {icon}
        </div>
        <div>
          <div className="text-[11px] text-gray-500 uppercase tracking-wide font-semibold">
            {label}
          </div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        </div>
      </div>
    </GlassPanel>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 bg-white/50 backdrop-blur border border-white/60 rounded-lg px-3 py-2">
      <div className="text-primary">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-gray-500 uppercase font-semibold">
          {label}
        </div>
        <div className="text-sm font-semibold text-gray-900 truncate">
          {value}
        </div>
      </div>
    </div>
  );
}
