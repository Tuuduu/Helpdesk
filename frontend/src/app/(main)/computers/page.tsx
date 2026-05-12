"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, X, Monitor } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { formatDateTime, getImageUrl } from "@/lib/utils";
import {
  COMPUTER_STATUS_LABELS,
  COMPUTER_STATUS_COLORS,
  type ComputerStatus,
} from "@/lib/constants";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  GlassPanel,
  Button,
  Input,
  Select,
  Badge,
  Table,
  Pagination,
  type Column,
} from "@/components/ui";
import type { ComputerListItem } from "@/types/computer";
import type { PagedResult } from "@/types/api";

const STATUS_OPTIONS = [
  { value: "", label: "Бүх төлөв" },
  { value: "Active", label: "Идэвхтэй" },
  { value: "InRepair", label: "Засварт" },
  { value: "InTransfer", label: "Шилжиж буй" },
  { value: "Retired", label: "Хасагдсан" },
];

interface CompanyOption {
  id: string;
  name: string;
}

export default function ComputersListPage() {
  const router = useRouter();
  const { isAdminOrAbove } = useAuth();

  const [data, setData] = useState<PagedResult<ComputerListItem> | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDesc, setSortDesc] = useState(true);

  // Load companies once for filter dropdown
  useEffect(() => {
    api.get<CompanyOption[]>("/companies").then((res) => {
      if (res.success && res.data) setCompanies(res.data);
    });
  }, []);

  const fetchComputers = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number | boolean> = {
      page,
      pageSize: 20,
      sortBy,
      sortDescending: sortDesc,
    };
    if (search.trim()) params.search = search.trim();
    if (statusFilter) params.status = statusFilter;
    if (companyFilter) params.companyId = companyFilter;

    const res = await api.get<PagedResult<ComputerListItem>>(
      "/computers",
      params
    );
    if (res.success && res.data) setData(res.data);
    setLoading(false);
  }, [page, sortBy, sortDesc, search, statusFilter, companyFilter]);

  useEffect(() => {
    fetchComputers();
  }, [fetchComputers]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, companyFilter]);

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDesc(!sortDesc);
    else {
      setSortBy(key);
      setSortDesc(true);
    }
  };

  const columns: Column<ComputerListItem>[] = [
    {
      key: "primaryImageUrl",
      header: "",
      width: "w-12",
      render: (row) =>
        row.primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getImageUrl(row.primaryImageUrl)}
            alt={row.assetCode}
            className="w-9 h-9 rounded-lg object-cover border border-gray-200"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Monitor className="w-4 h-4 text-primary" />
          </div>
        ),
    },
    {
      key: "assetCode",
      header: "Код",
      sortable: true,
      width: "w-[140px]",
      render: (row) => (
        <span className="font-mono text-xs font-medium text-primary">
          {row.assetCode}
        </span>
      ),
    },
    {
      key: "brand",
      header: "Брэнд / Загвар",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.brand}</div>
          <div className="text-xs text-gray-500">{row.model}</div>
        </div>
      ),
    },
    {
      key: "cpu",
      header: "CPU / RAM",
      render: (row) => (
        <div>
          <div className="text-sm text-gray-700 line-clamp-1">{row.cpu}</div>
          <div className="text-xs text-gray-500">{row.ramGb} GB RAM</div>
        </div>
      ),
    },
    {
      key: "ownerName",
      header: "Эзэмшигч",
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900">{row.ownerName}</div>
          <div className="text-xs text-gray-500">{row.position}</div>
        </div>
      ),
    },
    {
      key: "companyName",
      header: "Компани",
      render: (row) => (
        <span className="text-gray-600">{row.companyName}</span>
      ),
    },
    {
      key: "status",
      header: "Төлөв",
      sortable: true,
      render: (row) => (
        <Badge
          variant="custom"
          className={COMPUTER_STATUS_COLORS[row.status as ComputerStatus]}
        >
          {COMPUTER_STATUS_LABELS[row.status as ComputerStatus]}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Бүртгэсэн",
      sortable: true,
      render: (row) => (
        <span className="text-gray-500 text-xs">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Компьютер хөрөнгө"
        description="Бүртгэлтэй бүх компьютерийн жагсаалт"
        actions={
          isAdminOrAbove && (
            <Button
              icon={<Plus className="w-4 h-4" />}
              onClick={() => router.push("/computers/new")}
            >
              Шинэ компьютер
            </Button>
          )
        }
      />

      <GlassPanel padding="sm" className="mb-4">
        <div className="flex flex-wrap items-end gap-3 p-1">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <Input
              placeholder="Хайх... (код, брэнд, MAC, домайн, эзэмшигч)"
              icon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          {companies.length > 1 && (
            <div className="w-56">
              <Select
                options={[
                  { value: "", label: "Бүх компани" },
                  ...companies.map((c) => ({ value: c.id, label: c.name })),
                ]}
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              />
            </div>
          )}
          {(search || statusFilter || companyFilter) && (
            <Button
              variant="ghost"
              size="sm"
              icon={<X className="w-3 h-3" />}
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setCompanyFilter("");
              }}
            >
              Цэвэрлэх
            </Button>
          )}
        </div>
        {data && (
          <div className="mt-2 px-1 text-xs text-gray-500">
            {search || statusFilter || companyFilter ? "Илэрц: " : "Нийт: "}
            <span className="font-medium text-gray-700">{data.totalCount}</span>{" "}
            компьютер
          </div>
        )}
      </GlassPanel>

      <GlassPanel padding="none">
        <Table
          columns={columns}
          data={data?.items ?? []}
          loading={loading}
          sortBy={sortBy}
          sortDesc={sortDesc}
          onSort={handleSort}
          rowKey={(row) => row.id}
          onRowClick={(row) => router.push(`/computers/${row.id}`)}
          emptyMessage="Компьютер олдсонгүй"
        />
      </GlassPanel>

      {data && data.totalPages > 1 && (
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          totalCount={data.totalCount}
          totalPages={data.totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
}
