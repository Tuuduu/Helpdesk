"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Inbox, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime, cn } from "@/lib/utils";
import {
  TRANSFER_STATUS_LABELS,
  TRANSFER_STATUS_COLORS,
  type TransferRequestStatus,
} from "@/lib/constants";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  GlassPanel,
  Badge,
  Spinner,
  EmptyState,
} from "@/components/ui";
import type { TransferRequestListItem } from "@/types/computer";

type Tab = "receiver" | "approver";

export default function TransfersHubPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("receiver");
  const [items, setItems] = useState<TransferRequestListItem[]>([]);
  const [approverCount, setApproverCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const endpoint =
      tab === "receiver"
        ? "/computer-transfers/pending-receiver"
        : "/computer-transfers/pending-my-approval";
    const res = await api.get<TransferRequestListItem[]>(endpoint);
    if (res.success && res.data) setItems(res.data);
    else setItems([]);
    setLoading(false);
  }, [tab]);

  // Approver tab-ын count-ыг ачаалах
  useEffect(() => {
    api
      .get<TransferRequestListItem[]>("/computer-transfers/pending-my-approval")
      .then((res) => {
        if (res.success && res.data) setApproverCount(res.data.length);
      });
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <>
      <PageHeader
        title="Шилжүүлэг"
        description="Хүлээгдэж буй шилжүүлгийн хүсэлтүүд"
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 p-1 bg-white/40 backdrop-blur rounded-lg border border-white/60 w-fit">
        <TabButton
          active={tab === "receiver"}
          onClick={() => setTab("receiver")}
          icon={<Inbox className="w-4 h-4" />}
          label="Хүлээн авах"
        />
        {approverCount > 0 && (
          <TabButton
            active={tab === "approver"}
            onClick={() => setTab("approver")}
            icon={<CheckCircle2 className="w-4 h-4" />}
            label={`Миний батлах (${approverCount})`}
          />
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <GlassPanel>
          <EmptyState
            icon={<Inbox className="w-10 h-10" />}
            message={
              tab === "receiver"
                ? "Хүлээн авах хүсэлт алга — шинэ хүсэлт ирвэл энд гарна."
                : "Танаас батлах хүсэлт алга — шинэ хүсэлт ирвэл энд гарна."
            }
          />
        </GlassPanel>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <GlassPanel
              key={item.id}
              padding="md"
              className="cursor-pointer hover:scale-[1.005] transition-transform"
            >
              <div onClick={() => router.push(`/transfers/${item.id}`)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-xs text-primary">
                        {item.assetCode}
                      </span>
                      <Badge
                        variant="custom"
                        size="sm"
                        className={
                          TRANSFER_STATUS_COLORS[
                            item.status as TransferRequestStatus
                          ]
                        }
                      >
                        {
                          TRANSFER_STATUS_LABELS[
                            item.status as TransferRequestStatus
                          ]
                        }
                      </Badge>
                    </div>
                    <div className="font-semibold text-gray-900 mb-2">
                      {item.computerLabel}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <span className="font-medium">{item.fromUserName}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium">{item.toUserName}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {item.reason}
                    </p>
                  </div>
                  <div className="text-[11px] text-gray-400 whitespace-nowrap">
                    {formatDateTime(item.createdAt)}
                  </div>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-primary text-white shadow-sm"
          : "text-gray-600 hover:text-primary"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
