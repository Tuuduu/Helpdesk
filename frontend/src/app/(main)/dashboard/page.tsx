"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { GlassPanel, Card, Select, Spinner } from "@/components/ui";
import {
  Ticket,
  CheckCircle,
  Clock,
  TrendingUp,
  Star,
  Monitor,
  Wrench,
  ArrowLeftRight,
  Archive,
  Cpu,
  Calendar,
} from "lucide-react";
import { PERIOD_OPTIONS } from "@/lib/constants";
import { api } from "@/lib/api";
import type {
  DashboardStats,
  TicketChartItem,
  EngineerPerformance,
  FeedbackSummary,
} from "@/types/dashboard";
import type { ComputerDashboardResponse } from "@/types/computer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PERIOD_SELECT_OPTIONS = PERIOD_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

const CHART_COLORS = {
  created: "#2D2C70",
  closed: "#22c55e",
  assigned: "#8b5cf6",
  resolved: "#22c55e",
};

const RATING_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];
const RATING_LABELS = ["1 ★", "2 ★", "3 ★", "4 ★", "5 ★"];

const COMPANY_PIE_COLORS = [
  "#2D2C70",
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
];

export default function DashboardPage() {
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<TicketChartItem[]>([]);
  const [engineers, setEngineers] = useState<EngineerPerformance[]>([]);
  const [feedback, setFeedback] = useState<FeedbackSummary | null>(null);
  const [computerStats, setComputerStats] = useState<ComputerDashboardResponse | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const params = { period };

    const [statsRes, chartRes, engRes, fbRes, compRes] = await Promise.all([
      api.get<DashboardStats>("/dashboard/stats", params),
      api.get<TicketChartItem[]>("/dashboard/ticket-chart", params),
      api.get<EngineerPerformance[]>("/dashboard/engineers", params),
      api.get<FeedbackSummary>("/dashboard/feedback", params),
      api.get<ComputerDashboardResponse>("/computers/dashboard"),
    ]);

    if (statsRes.success && statsRes.data) setStats(statsRes.data);
    if (chartRes.success && chartRes.data) setChartData(chartRes.data);
    if (engRes.success && engRes.data) setEngineers(engRes.data);
    if (fbRes.success && fbRes.data) setFeedback(fbRes.data);
    if (compRes.success && compRes.data) setComputerStats(compRes.data);

    setLoading(false);
  }, [period]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const feedbackPieData = feedback
    ? Object.entries(feedback.distribution).map(([rating, count]) => ({
        name: RATING_LABELS[Number(rating) - 1],
        value: count,
      }))
    : [];

  return (
    <RoleGuard roles={["SuperAdmin", "Admin"]}>
      <PageHeader
        title="Хянах самбар"
        description="Тикет, компьютер хөрөнгийн ерөнхий статистик"
        actions={
          <div className="w-36">
            <Select
              options={PERIOD_SELECT_OPTIONS}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>
        }
      />

      {loading && !stats ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Section title — Tickets */}
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="w-5 h-5 text-primary" />
            <h2 className="text-base font-semibold text-gray-900">
              Тикетийн тойм
            </h2>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card
              title="Нийт тикет"
              value={stats?.totalTickets ?? 0}
              icon={<Ticket className="w-5 h-5" />}
            />
            <Card
              title="Нээлттэй"
              value={stats?.openTickets ?? 0}
              icon={<Clock className="w-5 h-5" />}
            />
            <Card
              title="Шийдвэрлэсэн"
              value={stats?.closedTickets ?? 0}
              icon={<CheckCircle className="w-5 h-5" />}
            />
            <Card
              title="Дундаж хугацаа"
              value={`${stats?.avgResolutionHours ?? 0}ц`}
              icon={<TrendingUp className="w-5 h-5" />}
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Ticket trend chart */}
            <GlassPanel className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Тикетийн хандлага
              </h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e5e7eb" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255,255,255,0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px" }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="created"
                      name="Үүсгэсэн"
                      fill={CHART_COLORS.created}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={24}
                    />
                    <Bar
                      dataKey="closed"
                      name="Хаагдсан"
                      fill={CHART_COLORS.closed}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Тикетийн мэдээлэл байхгүй" />
              )}
            </GlassPanel>

            {/* Feedback donut */}
            <GlassPanel>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Үнэлгээний тойм
              </h3>
              {feedback && feedback.totalCount > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={feedbackPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        stroke="none"
                      >
                        {feedbackPieData.map((_, i) => (
                          <Cell key={i} fill={RATING_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(255,255,255,0.95)",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-2 mt-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-2xl font-bold text-gray-900">
                      {feedback.averageRating}
                    </span>
                    <span className="text-sm text-gray-500">
                      / 5 ({feedback.totalCount})
                    </span>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3">
                    {feedbackPieData.map((entry, i) => (
                      <div
                        key={entry.name}
                        className="flex items-center gap-1.5 text-xs text-gray-600"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: RATING_COLORS[i] }}
                        />
                        {entry.name}: {entry.value}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyChart message="Үнэлгээ байхгүй" />
              )}
            </GlassPanel>
          </div>

          {/* Engineer performance */}
          <GlassPanel>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Инженерүүдийн гүйцэтгэл
            </h3>
            {engineers.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(200, engineers.length * 50)}>
                <BarChart
                  data={engineers}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="engineerName"
                    tick={{ fontSize: 12, fill: "#374151" }}
                    tickLine={false}
                    axisLine={false}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(255,255,255,0.95)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    formatter={(value, name) => [
                      String(value),
                      name === "assignedCount"
                        ? "Хуваарилсан"
                        : "Шийдвэрлэсэн",
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px" }}
                    iconType="circle"
                    formatter={(value: string) =>
                      value === "assignedCount"
                        ? "Хуваарилсан"
                        : "Шийдвэрлэсэн"
                    }
                  />
                  <Bar
                    dataKey="assignedCount"
                    fill={CHART_COLORS.assigned}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={20}
                  />
                  <Bar
                    dataKey="resolvedCount"
                    fill={CHART_COLORS.resolved}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Инженерийн мэдээлэл байхгүй" />
            )}

            {/* Stats table below chart */}
            {engineers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                  <span>Инженер</span>
                  <span className="text-center">Хуваарилсан</span>
                  <span className="text-center">Шийдвэрлэсэн</span>
                  <span className="text-center">Дундаж (цаг)</span>
                </div>
                {engineers.map((eng) => (
                  <div
                    key={eng.engineerId}
                    className="grid grid-cols-4 gap-2 text-sm py-2 px-1 hover:bg-gray-50/50 rounded-lg transition-colors"
                  >
                    <span className="text-gray-800 font-medium">
                      {eng.engineerName}
                    </span>
                    <span className="text-center text-gray-600">
                      {eng.assignedCount}
                    </span>
                    <span className="text-center text-gray-600">
                      {eng.resolvedCount}
                    </span>
                    <span className="text-center text-gray-600">
                      {eng.avgResolutionHours}ц
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>

          {/* Computer Assets section */}
          {computerStats && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-gray-900">
                  Компьютер хөрөнгийн тойм
                </h2>
              </div>

              {/* Computer status cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <Card
                  title="Нийт"
                  value={computerStats.totalCount}
                  icon={<Monitor className="w-5 h-5" />}
                />
                <Card
                  title="Идэвхтэй"
                  value={computerStats.activeCount}
                  icon={<CheckCircle className="w-5 h-5" />}
                />
                <Card
                  title="Засварт"
                  value={computerStats.inRepairCount}
                  icon={<Wrench className="w-5 h-5" />}
                />
                <Card
                  title="Шилжиж буй"
                  value={computerStats.inTransferCount}
                  icon={<ArrowLeftRight className="w-5 h-5" />}
                />
                <Card
                  title="Хасагдсан"
                  value={computerStats.retiredCount}
                  icon={<Archive className="w-5 h-5" />}
                />
              </div>

              {/* Secondary metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card
                  title="Дундаж RAM"
                  value={`${computerStats.averageRamGb} GB`}
                  icon={<Cpu className="w-5 h-5" />}
                />
                <Card
                  title="Дундаж нас"
                  value={`${Math.round(computerStats.averageAgeDays)} хоног`}
                  icon={<Calendar className="w-5 h-5" />}
                />
                <Card
                  title="Шилжүүлэг (30 хоног)"
                  value={computerStats.transfersLast30Days}
                  icon={<ArrowLeftRight className="w-5 h-5" />}
                />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By company pie */}
                <GlassPanel>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Компаниар хуваарилалт
                  </h3>
                  {computerStats.byCompany.length > 0 ? (
                    <div className="flex flex-col items-center">
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={computerStats.byCompany.map((c) => ({
                              name: c.name,
                              value: c.count,
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            dataKey="value"
                            stroke="none"
                          >
                            {computerStats.byCompany.map((_, i) => (
                              <Cell
                                key={i}
                                fill={COMPANY_PIE_COLORS[i % COMPANY_PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "rgba(255,255,255,0.95)",
                              border: "1px solid #e5e7eb",
                              borderRadius: "12px",
                              fontSize: "12px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                        {computerStats.byCompany.map((c, i) => (
                          <div
                            key={c.name}
                            className="flex items-center gap-1.5 text-xs text-gray-600"
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                background:
                                  COMPANY_PIE_COLORS[i % COMPANY_PIE_COLORS.length],
                              }}
                            />
                            {c.name}: {c.count}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyChart message="Компанийн өгөгдөл алга" />
                  )}
                </GlassPanel>

                {/* By brand bar */}
                <GlassPanel>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Брэндээр хуваарилалт
                  </h3>
                  {computerStats.byBrand.length > 0 ? (
                    <ResponsiveContainer
                      width="100%"
                      height={Math.max(240, computerStats.byBrand.length * 32)}
                    >
                      <BarChart
                        data={computerStats.byBrand}
                        layout="vertical"
                        margin={{ left: 10 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e5e7eb"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 11, fill: "#9ca3af" }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 12, fill: "#374151" }}
                          tickLine={false}
                          axisLine={false}
                          width={90}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(255,255,255,0.95)",
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            fontSize: "12px",
                          }}
                          formatter={(value) => [String(value), "Тоо"]}
                        />
                        <Bar
                          dataKey="count"
                          fill={CHART_COLORS.created}
                          radius={[0, 4, 4, 0]}
                          maxBarSize={20}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyChart message="Брэндийн өгөгдөл алга" />
                  )}
                </GlassPanel>
              </div>
            </div>
          )}
        </>
      )}
    </RoleGuard>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
      {message}
    </div>
  );
}
