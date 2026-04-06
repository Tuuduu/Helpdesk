"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, Search } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  GlassPanel,
  Input,
  Select,
  Table,
  Pagination,
  Spinner,
  type Column,
} from "@/components/ui";
import type { FeedbackResponse, FeedbackFilterRequest } from "@/types/feedback";
import type { PagedResult } from "@/types/api";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

const RATING_OPTIONS = [
  { value: "", label: "Бүх үнэлгээ" },
  { value: "5", label: "★★★★★ (5)" },
  { value: "4", label: "★★★★☆ (4)" },
  { value: "3", label: "★★★☆☆ (3)" },
  { value: "2", label: "★★☆☆☆ (2)" },
  { value: "1", label: "★☆☆☆☆ (1)" },
];

export default function FeedbackPage() {
  const { isAdminOrAbove } = useAuth();

  const [data, setData] = useState<PagedResult<FeedbackResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FeedbackFilterRequest>({
    page: 1,
    pageSize: 10,
    search: "",
    rating: undefined,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = isAdminOrAbove ? "/feedback" : "/feedback/my";
      const params: Record<string, string | number | boolean | undefined> = {
        page: filters.page,
        pageSize: filters.pageSize,
      };
      if (isAdminOrAbove) {
        if (filters.search) params.search = filters.search;
        if (filters.rating) params.rating = filters.rating;
      }
      const res = await api.get<PagedResult<FeedbackResponse>>(endpoint, params);
      if (res.success && res.data) {
        setData(res.data);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, isAdminOrAbove]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<FeedbackResponse>[] = [
    {
      key: "ticketNumber",
      header: "Тикет дугаар",
      width: "w-[130px]",
      render: (row) => (
        <span className="font-mono text-xs text-brand-primary font-medium">
          {row.ticketNumber}
        </span>
      ),
    },
    {
      key: "ticketTitle",
      header: "Тикет нэр",
      render: (row) => (
        <span className="font-medium text-gray-900 line-clamp-1">
          {row.ticketTitle}
        </span>
      ),
    },
    {
      key: "submittedByName",
      header: "Илгээсэн",
      render: (row) => row.submittedByName || row.guestName || "—",
    },
    {
      key: "rating",
      header: "Үнэлгээ",
      width: "w-[140px]",
      render: (row) => <Stars rating={row.rating} />,
    },
    {
      key: "comment",
      header: "Сэтгэгдэл",
      render: (row) => (
        <span className="text-gray-600 line-clamp-1">{row.comment || "—"}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Огноо",
      width: "w-[150px]",
      render: (row) => (
        <span className="text-xs text-gray-500">{formatDateTime(row.createdAt)}</span>
      ),
    },
  ];

  // User view — card-based
  if (!isAdminOrAbove) {
    return (
      <>
        <PageHeader
          title="Миний санал хүсэлт"
          description="Таны илгээсэн санал хүсэлтүүд"
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : !data || data.items.length === 0 ? (
          <GlassPanel>
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">Санал хүсэлт илгээгээгүй байна</p>
            </div>
          </GlassPanel>
        ) : (
          <div className="space-y-3">
            {data.items.map((fb) => (
              <GlassPanel key={fb.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-brand-primary font-medium">
                        {fb.ticketNumber}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {fb.ticketTitle}
                      </span>
                    </div>
                    {fb.comment && (
                      <p className="text-sm text-gray-600 mt-1">{fb.comment}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDateTime(fb.createdAt)}
                    </p>
                  </div>
                  <Stars rating={fb.rating} />
                </div>
              </GlassPanel>
            ))}

            {data.totalPages > 1 && (
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                totalCount={data.totalCount}
                totalPages={data.totalPages}
                onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
              />
            )}
          </div>
        )}
      </>
    );
  }

  // Admin view — table
  return (
    <>
      <PageHeader
        title="Санал хүсэлт"
        description="Хэрэглэгчдийн санал хүсэлт"
      />

      <GlassPanel padding="none">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Тикет, нэрээр хайх..."
              value={filters.search || ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
              }
              className="pl-9"
            />
          </div>
          <div className="w-44">
            <Select
              value={filters.rating ? String(filters.rating) : ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  rating: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                }))
              }
              options={RATING_OPTIONS}
            />
          </div>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          data={data?.items ?? []}
          loading={loading}
          emptyMessage="Санал хүсэлт олдсонгүй"
          emptyIcon={<MessageSquare className="w-12 h-12 text-gray-300" />}
          rowKey={(row) => row.id}
        />

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100">
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              totalCount={data.totalCount}
              totalPages={data.totalPages}
              onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
            />
          </div>
        )}
      </GlassPanel>
    </>
  );
}
