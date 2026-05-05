"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Inbox, Wrench, Archive } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime, cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { GlassPanel, Badge, Spinner, EmptyState } from "@/components/ui";
import {
  PROCESS_TYPE_LABELS,
  PROCESS_STATUS_LABELS,
  PROCESS_STATUS_COLORS,
  type ProcessType,
  type ProcessRequestListItem,
  type ProcessRequestStatus,
} from "@/types/computerProcess";

export default function ProcessesHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = (searchParams.get("type") as ProcessType) || "Repair";

  const [type, setType] = useState<ProcessType>(initialType);
  const [items, setItems] = useState<ProcessRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const endpoint =
      type === "Repair"
        ? "/computer-repairs/pending-my-approval"
        : "/computer-retirements/pending-my-approval";
    const res = await api.get<ProcessRequestListItem[]>(endpoint);
    if (res.success && res.data) setItems(res.data);
    else setItems([]);
    setLoading(false);
  }, [type]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <>
      <PageHeader
        title="Засвар & Акт"
        description="Танаас батлахыг хүлээж буй хүсэлтүүд"
      />

      <div className="flex items-center gap-1 mb-4 p-1 bg-white/40 backdrop-blur rounded-lg border border-white/60 w-fit">
        <TabButton
          active={type === "Repair"}
          onClick={() => setType("Repair")}
          icon={<Wrench className="w-4 h-4" />}
          label="Засвар"
        />
        <TabButton
          active={type === "Retirement"}
          onClick={() => setType("Retirement")}
          icon={<Archive className="w-4 h-4" />}
          label="Акт хасагдалт"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <GlassPanel>
          <EmptyState
            icon={<Inbox className="w-10 h-10" />}
            message={`Танаас ${PROCESS_TYPE_LABELS[type]} батлах хүсэлт алга`}
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
              <div onClick={() => router.push(`/processes/${item.id}`)}>
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
                          PROCESS_STATUS_COLORS[
                            item.status as ProcessRequestStatus
                          ]
                        }
                      >
                        {
                          PROCESS_STATUS_LABELS[
                            item.status as ProcessRequestStatus
                          ]
                        }
                      </Badge>
                      <Badge variant="info" size="sm">
                        {PROCESS_TYPE_LABELS[item.type]}
                      </Badge>
                    </div>
                    <div className="font-semibold text-gray-900 mb-2">
                      {item.computerLabel}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      Хүсэлт гаргасан:{" "}
                      <span className="font-medium">
                        {item.requestedByName}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {item.description}
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
