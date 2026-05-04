"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Monitor, ArrowLeftRight, HardDrive } from "lucide-react";
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
  Badge,
  Spinner,
  EmptyState,
} from "@/components/ui";
import type { ComputerListItem } from "@/types/computer";

export default function MyComputersPage() {
  const router = useRouter();
  const [computers, setComputers] = useState<ComputerListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await api.get<ComputerListItem[]>("/computers/me");
      if (res.success && res.data) setComputers(res.data);
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

  return (
    <>
      <PageHeader
        title="Миний компьютер"
        description="Танд хариуцагдсан компьютер хөрөнгө"
      />

      {computers.length === 0 ? (
        <GlassPanel>
          <EmptyState
            icon={<HardDrive className="w-10 h-10" />}
            message="Танд бүртгэгдсэн компьютер байхгүй байна. Шинээр хариуцлагандаа авбал энд харагдана."
          />
        </GlassPanel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {computers.map((c) => (
            <GlassPanel
              key={c.id}
              padding="md"
              className="cursor-pointer hover:scale-[1.01] transition-transform"
            >
              <div onClick={() => router.push(`/computers/${c.id}`)}>
                <div className="flex items-start gap-3 mb-3">
                  {c.primaryImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getImageUrl(c.primaryImageUrl)}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-primary">
                      {c.assetCode}
                    </div>
                    <div className="font-semibold text-gray-900 truncate">
                      {c.brand} {c.model}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {c.cpu} · {c.ramGb} GB
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pt-2 border-t border-gray-100">
                  <span className="font-mono">{c.macAddress}</span>
                  <Badge
                    variant="custom"
                    size="sm"
                    className={
                      COMPUTER_STATUS_COLORS[c.status as ComputerStatus]
                    }
                  >
                    {COMPUTER_STATUS_LABELS[c.status as ComputerStatus]}
                  </Badge>
                </div>

                <div className="text-[11px] text-gray-400">
                  Бүртгэсэн: {formatDateTime(c.createdAt)}
                </div>
              </div>

              {c.status === "Active" && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<ArrowLeftRight className="w-3.5 h-3.5" />}
                    onClick={() => router.push(`/my-computers/${c.id}/transfer`)}
                  >
                    Шилжүүлэх
                  </Button>
                </div>
              )}
            </GlassPanel>
          ))}
        </div>
      )}
    </>
  );
}
