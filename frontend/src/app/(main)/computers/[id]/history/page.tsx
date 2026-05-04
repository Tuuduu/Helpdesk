"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  History as HistoryIcon,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel, Button, Spinner, EmptyState } from "@/components/ui";
import type {
  TransferHistoryItem,
  ComputerResponse,
} from "@/types/computer";

export default function ComputerHistoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [computer, setComputer] = useState<ComputerResponse | null>(null);
  const [history, setHistory] = useState<TransferHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const [c, h] = await Promise.all([
      api.get<ComputerResponse>(`/computers/${id}`),
      api.get<TransferHistoryItem[]>(`/computers/${id}/transfer-history`),
    ]);
    if (c.success && c.data) setComputer(c.data);
    if (h.success && h.data) setHistory(h.data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Шилжүүлгийн түүх"
        description={
          computer ? `${computer.assetCode} · ${computer.brand} ${computer.model}` : ""
        }
        actions={
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.push(`/computers/${id}`)}
          >
            Буцах
          </Button>
        }
      />

      {history.length === 0 ? (
        <GlassPanel>
          <EmptyState
            icon={<HistoryIcon className="w-10 h-10" />}
            message="Шилжүүлгийн түүх алга — одоогоор бичлэг үүсээгүй байна."
          />
        </GlassPanel>
      ) : (
        <GlassPanel>
          <ol className="relative border-l-2 border-primary/20 ml-4 space-y-6">
            {history.map((h, i) => (
              <li key={h.id} className="ml-6">
                <span className="absolute -left-[11px] flex items-center justify-center w-5 h-5 bg-primary text-white rounded-full ring-4 ring-white">
                  <CheckCircle2 className="w-3 h-3" />
                </span>

                <div className="bg-white/60 backdrop-blur border border-white/70 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary uppercase">
                      Шилжүүлэг #{history.length - i}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(h.transferredAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      {h.fromUserName ?? "—"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-gray-900">
                      {h.toUserName}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500">
                    Баталсан нярав:{" "}
                    <span className="text-gray-700 font-medium">
                      {h.approvedByStorekeeperName}
                    </span>
                  </div>

                  {h.note && (
                    <p className="text-xs text-gray-600 italic mt-2 pt-2 border-t border-gray-100">
                      &ldquo;{h.note}&rdquo;
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </GlassPanel>
      )}
    </>
  );
}
