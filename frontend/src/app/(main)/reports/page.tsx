"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Search,
  FileSpreadsheet,
  X,
  Ticket,
  Clock,
  CheckCircle,
  TrendingUp,
  Monitor,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime, cn } from "@/lib/utils";
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_COLORS,
  CALL_TYPE_LABELS,
  type TicketStatus,
  type CallType,
} from "@/lib/constants";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleGuard } from "@/components/shared/RoleGuard";
import {
  GlassPanel,
  Button,
  Input,
  Select,
  Badge,
  Card,
  Table,
  Spinner,
  type Column,
} from "@/components/ui";
import { ComputerReportTab } from "@/components/reports/ComputerReportTab";
import type { ReportSummary, ReportRow } from "@/types/report";
import toast from "react-hot-toast";

type ReportTab = "ticket" | "computer";

const STATUS_OPTIONS = [
  { value: "", label: "Бүх төлөв" },
  { value: "New", label: "Шинэ" },
  { value: "Accepted", label: "Хүлээн авсан" },
  { value: "InProgress", label: "Шийдвэрлэж байна" },
  { value: "Closed", label: "Хаагдсан" },
];

interface FilterOption {
  id: string;
  name?: string;
  fullName?: string;
}

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>("ticket");
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [engineerId, setEngineerId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [status, setStatus] = useState("");

  // Filter options
  const [engineers, setEngineers] = useState<FilterOption[]>([]);
  const [companies, setCompanies] = useState<FilterOption[]>([]);

  // Load filter options on mount
  useEffect(() => {
    async function loadOptions() {
      const [engRes, compRes] = await Promise.all([
        api.get<FilterOption[]>("/users/engineers"),
        api.get<FilterOption[]>("/companies"),
      ]);
      if (engRes.success && engRes.data) setEngineers(engRes.data);
      if (compRes.success && compRes.data) setCompanies(compRes.data);
    }
    loadOptions();
  }, []);

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (engineerId) params.engineerId = engineerId;
    if (companyId) params.companyId = companyId;
    if (status) params.status = status;
    return params;
  }, [dateFrom, dateTo, engineerId, companyId, status]);

  const handlePreview = useCallback(async () => {
    setLoading(true);
    const res = await api.get<ReportSummary>("/reports/preview", buildParams());
    if (res.success && res.data) {
      setReport(res.data);
    } else {
      toast.error("Тайлан ачаалахад алдаа гарлаа");
    }
    setLoading(false);
  }, [buildParams]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.download("/reports/export", buildParams());
      if (res.success && res.data) {
        const url = window.URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Тайлан_${new Date().toISOString().slice(0, 10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success("Excel файл татагдлаа");
      }
    } catch {
      toast.error("Экспорт хийхэд алдаа гарлаа");
    }
    setExporting(false);
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setEngineerId("");
    setCompanyId("");
    setStatus("");
    setReport(null);
  };

  const hasFilters = dateFrom || dateTo || engineerId || companyId || status;

  const columns: Column<ReportRow>[] = [
    {
      key: "ticketNumber",
      header: "Дугаар",
      width: "w-[130px]",
      render: (row) => (
        <span className="font-mono text-xs font-medium text-primary">
          {row.ticketNumber}
        </span>
      ),
    },
    {
      key: "title",
      header: "Гарчиг",
      render: (row) => (
        <span className="text-gray-900 font-medium line-clamp-1 text-sm">
          {row.title}
        </span>
      ),
    },
    {
      key: "companyName",
      header: "Компани",
      render: (row) => (
        <span className="text-gray-600 text-sm">{row.companyName}</span>
      ),
    },
    {
      key: "requesterName",
      header: "Хүсэлт гаргагч",
      render: (row) => (
        <span className="text-gray-600 text-sm">{row.requesterName}</span>
      ),
    },
    {
      key: "callType",
      header: "Төрөл",
      render: (row) => (
        <span className="text-gray-500 text-xs">
          {CALL_TYPE_LABELS[row.callType as CallType] ?? row.callType}
        </span>
      ),
    },
    {
      key: "status",
      header: "Төлөв",
      render: (row) => (
        <Badge
          variant="custom"
          size="sm"
          className={
            TICKET_STATUS_COLORS[row.status as TicketStatus] ?? ""
          }
        >
          {TICKET_STATUS_LABELS[row.status as TicketStatus] ?? row.status}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "Зэрэглэл",
      render: (row) => (
        <Badge
          variant="custom"
          size="sm"
          className={
            TICKET_PRIORITY_COLORS[row.priority as keyof typeof TICKET_PRIORITY_COLORS] ?? ""
          }
        >
          {TICKET_PRIORITY_LABELS[row.priority as keyof typeof TICKET_PRIORITY_LABELS] ?? row.priority}
        </Badge>
      ),
    },
    {
      key: "assignedTo",
      header: "Хариуцагч",
      render: (row) => (
        <span className="text-gray-600 text-sm">{row.assignedTo || "—"}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Үүсгэсэн",
      render: (row) => (
        <span className="text-gray-500 text-xs">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: "resolutionHours",
      header: "Шийдсэн (цаг)",
      align: "right" as const,
      render: (row) => (
        <span className="text-gray-600 text-sm">
          {row.resolutionHours != null ? `${row.resolutionHours}ц` : "—"}
        </span>
      ),
    },
  ];

  return (
    <RoleGuard roles={["SuperAdmin", "Admin"]}>
      <PageHeader
        title="Тайлан"
        description="Тикет ба компьютерийн тайлан, Excel-ээр татах"
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 p-1 bg-white/40 backdrop-blur rounded-lg border border-white/60 w-fit">
        <button
          type="button"
          onClick={() => setTab("ticket")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            tab === "ticket"
              ? "bg-primary text-white shadow-sm"
              : "text-gray-600 hover:text-primary"
          )}
        >
          <Ticket className="w-4 h-4" />
          Тикет
        </button>
        <button
          type="button"
          onClick={() => setTab("computer")}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            tab === "computer"
              ? "bg-primary text-white shadow-sm"
              : "text-gray-600 hover:text-primary"
          )}
        >
          <Monitor className="w-4 h-4" />
          Компьютер
        </button>
      </div>

      {tab === "computer" ? (
        <ComputerReportTab />
      ) : (
      <>
      {/* Filters */}
      <GlassPanel className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Шүүлтүүр
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            label="Эхлэх огноо"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="Дуусах огноо"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <Select
            label="Төлөв"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
          {companies.length > 0 && (
            <Select
              label="Компани"
              options={[
                { value: "", label: "Бүх компани" },
                ...companies.map((c) => ({
                  value: c.id,
                  label: c.name ?? "",
                })),
              ]}
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            />
          )}
          {engineers.length > 0 && (
            <Select
              label="Инженер"
              options={[
                { value: "", label: "Бүх инженер" },
                ...engineers.map((e) => ({
                  value: e.id,
                  label: e.fullName ?? "",
                })),
              ]}
              value={engineerId}
              onChange={(e) => setEngineerId(e.target.value)}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-gray-100">
          <Button
            icon={<Search className="w-4 h-4" />}
            onClick={handlePreview}
            loading={loading}
          >
            Тайлан харах
          </Button>
          <Button
            variant="secondary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExport}
            loading={exporting}
          >
            Excel татах
          </Button>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              icon={<X className="w-3 h-3" />}
              onClick={clearFilters}
            >
              Цэвэрлэх
            </Button>
          )}
        </div>
      </GlassPanel>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : report ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card
              title="Нийт тикет"
              value={report.totalTickets}
              icon={<Ticket className="w-5 h-5" />}
            />
            <Card
              title="Нээлттэй"
              value={report.openTickets}
              icon={<Clock className="w-5 h-5" />}
            />
            <Card
              title="Хаагдсан"
              value={report.closedTickets}
              icon={<CheckCircle className="w-5 h-5" />}
            />
            <Card
              title="Дундаж хугацаа"
              value={`${report.avgResolutionHours}ц`}
              icon={<TrendingUp className="w-5 h-5" />}
            />
          </div>

          {/* Data table */}
          <GlassPanel padding="none">
            <Table
              columns={columns}
              data={report.rows}
              rowKey={(row) => row.ticketNumber}
              emptyMessage="Тикет олдсонгүй"
            />
          </GlassPanel>

          {report.rows.length > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>Нийт {report.rows.length} тикет</span>
              <Button
                variant="secondary"
                size="sm"
                icon={<FileSpreadsheet className="w-4 h-4" />}
                onClick={handleExport}
                loading={exporting}
              >
                Excel татах
              </Button>
            </div>
          )}
        </>
      ) : (
        <GlassPanel>
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileSpreadsheet className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">
              Шүүлтүүр тохируулаад &quot;Тайлан харах&quot; дарна уу
            </p>
          </div>
        </GlassPanel>
      )}
      </>
      )}
    </RoleGuard>
  );
}
