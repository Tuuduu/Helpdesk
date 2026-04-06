"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Building2,
  Phone,
  Monitor,
  Briefcase,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
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
import {
  GlassPanel,
  Button,
  Badge,
  Select,
  Textarea,
  Modal,
  Spinner,
} from "@/components/ui";
import type { TicketResponse, TicketHistoryItem } from "@/types/ticket";
import toast from "react-hot-toast";

interface EngineerOption {
  id: string;
  fullName: string;
}

const STATUS_OPTIONS = [
  { value: "New", label: "Шинэ" },
  { value: "Accepted", label: "Хүлээн авсан" },
  { value: "InProgress", label: "Шийдвэрлэж байна" },
  { value: "Closed", label: "Хаагдсан" },
];

export default function TicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { isAdminOrAbove } = useAuth();

  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Status update modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<TicketStatus>("Accepted");
  const [statusNote, setStatusNote] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  // Assign modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [engineers, setEngineers] = useState<EngineerOption[]>([]);
  const [selectedEngineer, setSelectedEngineer] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchTicket = useCallback(async () => {
    const res = await api.get<TicketResponse>(`/tickets/${params.id}`);
    if (res.success && res.data) {
      setTicket(res.data);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleUpdateStatus = async () => {
    setStatusLoading(true);
    const res = await api.patch<TicketResponse>(
      `/tickets/${params.id}/status`,
      { newStatus, note: statusNote || undefined }
    );
    if (res.success && res.data) {
      setTicket(res.data);
      setStatusModalOpen(false);
      setStatusNote("");
      toast.success("Төлөв амжилттай өөрчлөгдлөө");
    } else {
      toast.error(res.errors?.[0] || "Алдаа гарлаа");
    }
    setStatusLoading(false);
  };

  const handleAssign = async () => {
    if (!selectedEngineer) return;
    setAssignLoading(true);
    const res = await api.patch<TicketResponse>(
      `/tickets/${params.id}/assign`,
      { assignToId: selectedEngineer }
    );
    if (res.success && res.data) {
      setTicket(res.data);
      setAssignModalOpen(false);
      setSelectedEngineer("");
      toast.success("Инженер хуваарилагдлаа");
    } else {
      toast.error(res.errors?.[0] || "Алдаа гарлаа");
    }
    setAssignLoading(false);
  };

  const openAssignModal = async () => {
    setAssignModalOpen(true);
    if (engineers.length === 0) {
      const res = await api.get<EngineerOption[]>("/users/engineers");
      if (res.success && res.data) {
        setEngineers(res.data);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20 text-gray-500">
        Тикет олдсонгүй
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={ticket.ticketNumber}
        description={ticket.title}
        actions={
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.push("/tickets")}
          >
            Буцах
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status bar */}
          <GlassPanel padding="sm">
            <div className="flex flex-wrap items-center gap-3 p-1">
              <Badge
                variant="custom"
                size="md"
                className={TICKET_STATUS_COLORS[ticket.status]}
              >
                {TICKET_STATUS_LABELS[ticket.status]}
              </Badge>
              <Badge
                variant="custom"
                size="md"
                className={TICKET_PRIORITY_COLORS[ticket.priority]}
              >
                {TICKET_PRIORITY_LABELS[ticket.priority]}
              </Badge>
              <Badge variant="neutral" size="md">
                {CALL_TYPE_LABELS[ticket.callType as CallType]}
              </Badge>

              {isAdminOrAbove && ticket.status !== "Closed" && (
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setNewStatus(ticket.status as TicketStatus);
                      setStatusModalOpen(true);
                    }}
                  >
                    Төлөв өөрчлөх
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<UserCheck className="w-3.5 h-3.5" />}
                    onClick={openAssignModal}
                  >
                    Хуваарилах
                  </Button>
                </div>
              )}
            </div>
          </GlassPanel>

          {/* Description */}
          <GlassPanel>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Дэлгэрэнгүй тайлбар
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>
          </GlassPanel>

          {/* Requester info */}
          <GlassPanel>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Хүсэлт гаргагчийн мэдээлэл
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow icon={User} label="Нэр" value={ticket.fullName} />
              <InfoRow icon={Building2} label="Компани" value={ticket.companyName} />
              <InfoRow icon={Phone} label="Утас" value={ticket.phoneNumber} />
              <InfoRow icon={Briefcase} label="Албан тушаал" value={ticket.position} />
              <InfoRow icon={Monitor} label="Компьютер" value={ticket.computerNumber} />
              <InfoRow
                icon={UserCheck}
                label="Хариуцагч"
                value={ticket.assignedToName}
              />
            </div>
          </GlassPanel>
        </div>

        {/* Sidebar — History */}
        <div>
          <GlassPanel>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Түүх
            </h3>
            {ticket.history.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Түүх байхгүй
              </p>
            ) : (
              <div className="space-y-0">
                {ticket.history.map((item, index) => (
                  <HistoryEntry
                    key={item.id}
                    item={item}
                    isLast={index === ticket.history.length - 1}
                  />
                ))}
              </div>
            )}

            {/* Meta info */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              <MetaRow label="Үүсгэсэн огноо" value={formatDateTime(ticket.createdAt)} />
              {ticket.closedAt && (
                <MetaRow label="Хаасан огноо" value={formatDateTime(ticket.closedAt)} />
              )}
              {ticket.closedByName && (
                <MetaRow label="Хаасан" value={ticket.closedByName} />
              )}
              {ticket.isGuest && (
                <MetaRow label="Төрөл" value="Зочин хэрэглэгч" />
              )}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Status update modal */}
      <Modal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Төлөв өөрчлөх"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setStatusModalOpen(false)}
            >
              Болих
            </Button>
            <Button loading={statusLoading} onClick={handleUpdateStatus}>
              Хадгалах
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Шинэ төлөв"
            options={STATUS_OPTIONS}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
          />
          <Textarea
            label="Тэмдэглэл"
            placeholder="Нэмэлт тэмдэглэл..."
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>

      {/* Assign modal */}
      <Modal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Инженер хуваарилах"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setAssignModalOpen(false)}
            >
              Болих
            </Button>
            <Button
              loading={assignLoading}
              onClick={handleAssign}
              disabled={!selectedEngineer}
            >
              Хуваарилах
            </Button>
          </>
        }
      >
        <Select
          label="Инженер сонгох"
          placeholder="Инженер сонгоно уу"
          options={engineers.map((e) => ({
            value: e.id,
            label: e.fullName,
          }))}
          value={selectedEngineer}
          onChange={(e) => setSelectedEngineer(e.target.value)}
        />
      </Modal>
    </>
  );
}

// ── Sub-components ──

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <span className="text-gray-500">{label}:</span>
      <span className="text-gray-800 font-medium">{value || "—"}</span>
    </div>
  );
}

function HistoryEntry({
  item,
  isLast,
}: {
  item: TicketHistoryItem;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
        {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
      </div>

      {/* Content */}
      <div className="pb-4 min-w-0">
        <p className="text-sm font-medium text-gray-800">{item.action}</p>
        {item.fromValue && item.toValue && (
          <p className="text-xs text-gray-500 mt-0.5">
            {item.fromValue} → {item.toValue}
          </p>
        )}
        {!item.fromValue && item.toValue && (
          <p className="text-xs text-gray-500 mt-0.5">{item.toValue}</p>
        )}
        {item.note && (
          <p className="text-xs text-gray-500 mt-0.5 italic">{item.note}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-gray-400">
            {item.performedByName}
          </span>
          <span className="text-[11px] text-gray-300">
            {formatDateTime(item.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-700 font-medium">{value}</span>
    </div>
  );
}
