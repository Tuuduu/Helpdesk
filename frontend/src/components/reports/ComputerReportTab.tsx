"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Search,
  FileSpreadsheet,
  X,
  Monitor,
  HardDrive,
  Cpu,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  COMPUTER_STATUS_LABELS,
  COMPUTER_STATUS_COLORS,
  COMPUTER_KIND_LABELS,
  COMPUTER_KIND_COLORS,
  type ComputerStatus,
  type ComputerKind,
} from "@/lib/constants";
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
import type {
  ComputerReportSummary,
  ComputerReportRow,
} from "@/types/computer";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "", label: "Бүх төлөв" },
  { value: "Active", label: "Идэвхтэй" },
  { value: "InRepair", label: "Засварт" },
  { value: "InTransfer", label: "Шилжиж буй" },
  { value: "Retired", label: "Хасагдсан" },
];

const KIND_OPTIONS = [
  { value: "", label: "Бүх төрөл" },
  { value: "Desktop", label: "Суурин" },
  { value: "Laptop", label: "Зөөврийн" },
];

interface CompanyOption {
  id: string;
  name: string;
}

export function ComputerReportTab() {
  const [report, setReport] = useState<ComputerReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [status, setStatus] = useState("");
  const [kind, setKind] = useState("");
  const [brand, setBrand] = useState("");
  const [department, setDepartment] = useState("");

  const [companies, setCompanies] = useState<CompanyOption[]>([]);

  useEffect(() => {
    api.get<CompanyOption[]>("/companies").then((res) => {
      if (res.success && res.data) setCompanies(res.data);
    });
  }, []);

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (companyId) params.companyId = companyId;
    if (status) params.status = status;
    if (kind) params.kind = kind;
    if (brand.trim()) params.brand = brand.trim();
    if (department.trim()) params.department = department.trim();
    return params;
  }, [dateFrom, dateTo, companyId, status, kind, brand, department]);

  const handlePreview = useCallback(async () => {
    setLoading(true);
    const res = await api.get<ComputerReportSummary>(
      "/computers/report/preview",
      buildParams()
    );
    if (res.success && res.data) setReport(res.data);
    else toast.error("Тайлан ачаалахад алдаа гарлаа");
    setLoading(false);
  }, [buildParams]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.download(
        "/computers/report/export",
        buildParams()
      );
      if (res.success && res.data) {
        const url = window.URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Компьютер_тайлан_${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`;
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
    setCompanyId("");
    setStatus("");
    setKind("");
    setBrand("");
    setDepartment("");
    setReport(null);
  };

  const hasFilters =
    dateFrom || dateTo || companyId || status || kind || brand || department;

  const columns: Column<ComputerReportRow>[] = [
    {
      key: "assetCode",
      header: "Код",
      width: "w-[130px]",
      render: (r) => (
        <span className="font-mono text-xs font-medium text-primary">
          {r.assetCode}
        </span>
      ),
    },
    {
      key: "kind",
      header: "Төрөл",
      render: (r) => (
        <Badge
          variant="custom"
          size="sm"
          className={COMPUTER_KIND_COLORS[r.kind as ComputerKind] ?? ""}
        >
          {COMPUTER_KIND_LABELS[r.kind as ComputerKind] ?? r.kind}
        </Badge>
      ),
    },
    {
      key: "brand",
      header: "Брэнд / Загвар",
      render: (r) => (
        <div>
          <div className="font-medium text-gray-900 text-sm">{r.brand}</div>
          <div className="text-xs text-gray-500">{r.model}</div>
          {r.monitor && (
            <div className="text-[11px] text-gray-400 mt-0.5">
              Дэлгэц: {r.monitor}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "cpu",
      header: "CPU / RAM / GPU",
      render: (r) => (
        <div>
          <div className="text-xs text-gray-700 line-clamp-1">{r.cpu}</div>
          <div className="text-xs text-gray-500">{r.ramGb} GB</div>
          {r.gpu && (
            <div className="text-[11px] text-gray-400 line-clamp-1">
              {r.gpu}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "storages",
      header: "Storage",
      render: (r) => (
        <span className="text-xs text-gray-600">{r.storages || "—"}</span>
      ),
    },
    {
      key: "macAddress",
      header: "MAC / Домайн",
      render: (r) => (
        <div>
          <span className="font-mono text-[11px] text-gray-600 line-clamp-2">
            {r.macAddress || "—"}
          </span>
          {r.domainName && (
            <div className="font-mono text-[11px] text-primary mt-0.5">
              {r.domainName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "ownerName",
      header: "Эзэмшигч",
      render: (r) => (
        <div>
          <div className="text-sm text-gray-900">{r.ownerName}</div>
          <div className="text-xs text-gray-500">{r.position}</div>
          {r.department && (
            <div className="text-[11px] text-gray-400">{r.department}</div>
          )}
        </div>
      ),
    },
    {
      key: "companyName",
      header: "Компани",
      render: (r) => (
        <span className="text-gray-600 text-sm">{r.companyName}</span>
      ),
    },
    {
      key: "accessories",
      header: "Дагалдах",
      render: (r) => (
        <span className="text-xs text-gray-600 line-clamp-2">
          {r.accessories || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Төлөв",
      render: (r) => (
        <Badge
          variant="custom"
          size="sm"
          className={
            COMPUTER_STATUS_COLORS[r.status as ComputerStatus] ?? ""
          }
        >
          {COMPUTER_STATUS_LABELS[r.status as ComputerStatus] ?? r.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Бүртгэсэн",
      render: (r) => (
        <span className="text-gray-500 text-xs">
          {formatDate(r.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <GlassPanel className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Шүүлтүүр</h3>
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
          <Select
            label="Төрөл"
            options={KIND_OPTIONS}
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          />
          {companies.length > 0 && (
            <Select
              label="Компани"
              options={[
                { value: "", label: "Бүх компани" },
                ...companies.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            />
          )}
          <Input
            label="Брэнд"
            placeholder="Dell, HP, Lenovo..."
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
          <Input
            label="Хэлтэс"
            placeholder="НББ, IT..."
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
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

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <Card
              title="Нийт"
              value={report.totalCount}
              icon={<Monitor className="w-5 h-5" />}
            />
            <Card
              title="Идэвхтэй"
              value={report.activeCount}
              icon={<Monitor className="w-5 h-5" />}
            />
            <Card
              title="Засварт"
              value={report.inRepairCount}
              icon={<HardDrive className="w-5 h-5" />}
            />
            <Card
              title="Дундаж RAM"
              value={`${report.averageRamGb} GB`}
              icon={<Cpu className="w-5 h-5" />}
            />
            <Card
              title="Дундаж нас"
              value={`${Math.round(report.averageAgeDays)} хоног`}
              icon={<Calendar className="w-5 h-5" />}
            />
          </div>

          <GlassPanel padding="none">
            <Table
              columns={columns}
              data={report.rows}
              rowKey={(row) => row.assetCode}
              emptyMessage="Компьютер олдсонгүй"
            />
          </GlassPanel>

          {report.rows.length > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>Нийт {report.rows.length} компьютер</span>
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
            <Monitor className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">
              Шүүлтүүр тохируулаад &quot;Тайлан харах&quot; дарна уу
            </p>
          </div>
        </GlassPanel>
      )}
    </>
  );
}
