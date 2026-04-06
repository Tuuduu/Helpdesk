"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import {
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_PRIORITY_LABELS,
  TICKET_PRIORITY_COLORS,
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
import type { TicketListItem } from "@/types/ticket";
import type { PagedResult } from "@/types/api";

const STATUS_OPTIONS = [
  { value: "", label: "Бүх төлөв" },
  { value: "New", label: "Шинэ" },
  { value: "Accepted", label: "Хүлээн авсан" },
  { value: "InProgress", label: "Шийдвэрлэж байна" },
  { value: "Closed", label: "Хаагдсан" },
];

export default function TicketsPage() {
  const router = useRouter();
  const { isAdminOrAbove } = useAuth();

  const [data, setData] = useState<PagedResult<TicketListItem> | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDesc, setSortDesc] = useState(true);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number | boolean> = {
      page,
      pageSize: 20,
      sortBy,
      sortDescending: sortDesc,
    };
    if (search.trim()) params.search = search.trim();
    if (statusFilter) params.status = statusFilter;

    const endpoint = isAdminOrAbove ? "/tickets" : "/tickets/my";
    const res = await api.get<PagedResult<TicketListItem>>(endpoint, params);

    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  }, [page, sortBy, sortDesc, search, statusFilter, isAdminOrAbove]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(key);
      setSortDesc(true);
    }
  };

  const columns: Column<TicketListItem>[] = [
    {
      key: "ticketNumber",
      header: "Дугаар",
      sortable: true,
      width: "w-[140px]",
      render: (row) => (
        <span className="font-mono text-xs font-medium text-primary">
          {row.ticketNumber}
        </span>
      ),
    },
    {
      key: "title",
      header: "Гарчиг",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900 line-clamp-1">
          {row.title}
        </span>
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
      key: "fullName",
      header: "Хүсэлт гаргагч",
      render: (row) => (
        <span className="text-gray-600">{row.fullName}</span>
      ),
    },
    {
      key: "status",
      header: "Төлөв",
      sortable: true,
      render: (row) => (
        <Badge variant="custom" className={TICKET_STATUS_COLORS[row.status]}>
          {TICKET_STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      key: "priority",
      header: "Зэрэглэл",
      sortable: true,
      render: (row) => (
        <Badge variant="custom" className={TICKET_PRIORITY_COLORS[row.priority]}>
          {TICKET_PRIORITY_LABELS[row.priority]}
        </Badge>
      ),
    },
    {
      key: "assignedToName",
      header: "Хариуцагч",
      render: (row) => (
        <span className="text-gray-600">
          {row.assignedToName || "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Огноо",
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
        title="Тикетүүд"
        description="Бүх ирсэн тикетүүдийн жагсаалт"
        actions={
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => router.push("/tickets/create")}
          >
            Тикет үүсгэх
          </Button>
        }
      />

      {/* Filters */}
      <GlassPanel padding="sm" className="mb-4">
        <div className="flex flex-wrap items-end gap-3 p-1">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <Input
              placeholder="Хайх... (дугаар, гарчиг, нэр)"
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
          {(search || statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              icon={<X className="w-3 h-3" />}
              onClick={() => {
                setSearch("");
                setStatusFilter("");
              }}
            >
              Цэвэрлэх
            </Button>
          )}
        </div>
      </GlassPanel>

      {/* Table */}
      <GlassPanel padding="none">
        <Table
          columns={columns}
          data={data?.items ?? []}
          loading={loading}
          sortBy={sortBy}
          sortDesc={sortDesc}
          onSort={handleSort}
          rowKey={(row) => row.id}
          onRowClick={(row) => router.push(`/tickets/${row.id}`)}
          emptyMessage="Тикет олдсонгүй"
        />
      </GlassPanel>

      {/* Pagination */}
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
