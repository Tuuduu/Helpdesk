"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  X,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  User as UserIcon,
  Inbox,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime } from "@/lib/utils";
import {
  TRANSFER_STATUS_LABELS,
  TRANSFER_STATUS_COLORS,
  type TransferRequestStatus,
} from "@/lib/constants";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  GlassPanel,
  Button,
  Badge,
  Textarea,
  Spinner,
} from "@/components/ui";
import type {
  TransferRequestResponse,
  WorkflowStepProgress,
} from "@/types/computer";

export default function TransferDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();

  const [transfer, setTransfer] = useState<TransferRequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [note, setNote] = useState("");

  const fetch = useCallback(async () => {
    setLoading(true);
    const res = await api.get<TransferRequestResponse>(
      `/computer-transfers/${id}`
    );
    if (res.success && res.data) setTransfer(res.data);
    else toast.error(res.errors?.[0] || "Хүсэлт олдсонгүй");
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const act = async (action: string) => {
    setActing(true);
    const res = await api.post<TransferRequestResponse>(
      `/computer-transfers/${id}/${action}`,
      { note: note.trim() || undefined }
    );
    if (res.success && res.data) {
      toast.success("Боловсруулагдлаа");
      router.push("/transfers");
    } else {
      toast.error(res.errors?.[0] || "Алдаа");
    }
    setActing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!transfer) return null;

  const status = transfer.status as TransferRequestStatus;
  const isReceiver = transfer.toUserId === user?.id;
  const currentStep = transfer.workflowSteps.find((s) => s.isCurrent);
  const canApproveStep =
    status === "PendingApproval" &&
    !!currentStep &&
    !!user &&
    currentStep.approverUserIds.includes(user.id);
  const canReceiverAct = isReceiver && status === "PendingReceiver";

  return (
    <>
      <PageHeader
        title="Шилжүүлгийн хүсэлт"
        description={`${transfer.assetCode} · ${transfer.computerLabel}`}
        actions={
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.push("/transfers")}
          >
            Буцах
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassPanel className="lg:col-span-2">
          <div className="flex items-start justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-900">
              Хүсэлтийн дэлгэрэнгүй
            </h3>
            <Badge variant="custom" className={TRANSFER_STATUS_COLORS[status]}>
              {TRANSFER_STATUS_LABELS[status]}
            </Badge>
          </div>

          {/* Topology progress */}
          <WorkflowProgress
            steps={transfer.workflowSteps}
            fromName={transfer.fromUserName}
            toName={transfer.toUserName}
            status={status}
          />

          <div className="space-y-3 text-sm mt-5">
            <Field label="Шалтгаан">
              <p className="text-gray-700 whitespace-pre-wrap">
                {transfer.reason}
              </p>
            </Field>
            <Field label="Хүсэлт гаргасан">
              <div className="flex items-center gap-2 text-gray-700">
                <UserIcon className="w-3.5 h-3.5" />
                {transfer.requestedByName}
                <span className="text-gray-400">·</span>
                <Calendar className="w-3.5 h-3.5" />
                {formatDateTime(transfer.createdAt)}
              </div>
            </Field>

            {transfer.receiverActionAt && (
              <Field label="Хүлээн авагчийн үйлдэл">
                <div className="text-gray-700">
                  {formatDateTime(transfer.receiverActionAt)}
                </div>
                {transfer.receiverNote && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    {transfer.receiverNote}
                  </p>
                )}
              </Field>
            )}
          </div>
        </GlassPanel>

        <GlassPanel>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Үйлдэл</h3>

          {!canApproveStep && !canReceiverAct ? (
            <p className="text-xs text-gray-500 italic">
              Танд энэ хүсэлт дээр одоогоор үйлдэл хийх эрх алга.
            </p>
          ) : (
            <div className="space-y-4">
              <Textarea
                label="Тэмдэглэл (заавал биш)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Шалтгаан, нэмэлт мэдээлэл..."
              />

              {canApproveStep && currentStep && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">
                    Та <b>{currentStep.name}</b> алхмыг батлах эсэхээ
                    шийдэхдэх боломжтой
                  </p>
                  <Button
                    className="w-full"
                    icon={<Check className="w-4 h-4" />}
                    loading={acting}
                    onClick={() => act("approve-step")}
                  >
                    Зөвшөөрөх
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full"
                    icon={<X className="w-4 h-4" />}
                    loading={acting}
                    onClick={() => act("reject-step")}
                  >
                    Татгалзах
                  </Button>
                </div>
              )}

              {canReceiverAct && (
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    icon={<Check className="w-4 h-4" />}
                    loading={acting}
                    onClick={() => act("approve-receiver")}
                  >
                    Хүлээн авах
                  </Button>
                  <Button
                    variant="danger"
                    className="w-full"
                    icon={<X className="w-4 h-4" />}
                    loading={acting}
                    onClick={() => act("reject-receiver")}
                  >
                    Татгалзах
                  </Button>
                </div>
              )}
            </div>
          )}
        </GlassPanel>
      </div>
    </>
  );
}

function WorkflowProgress({
  steps,
  fromName,
  toName,
  status,
}: {
  steps: WorkflowStepProgress[];
  fromName: string;
  toName: string;
  status: TransferRequestStatus;
}) {
  const allMiddleDone = steps.length > 0 && steps.every((s) => s.isCompleted);
  const receiverDone = status === "Approved";

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-stretch gap-2 min-w-max">
        <FlowNode
          icon={<UserIcon className="w-4 h-4" />}
          title={fromName}
          subtitle="Эзэмшигч"
          color="from-gray-500 to-gray-700"
          completed
        />

        {steps.map((s) => (
          <ApproverNode key={s.order} step={s} />
        ))}

        <Arrow active={allMiddleDone || steps.length === 0} />

        <FlowNode
          icon={<Inbox className="w-4 h-4" />}
          title={toName}
          subtitle="Хүлээн авагч"
          color={receiverDone ? "from-green-500 to-green-700" : "from-blue-500 to-blue-700"}
          completed={receiverDone}
          current={status === "PendingReceiver"}
        />
      </div>
    </div>
  );
}

function FlowNode({
  icon,
  title,
  subtitle,
  color,
  completed,
  current,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color: string;
  completed?: boolean;
  current?: boolean;
}) {
  return (
    <div className="flex flex-col items-center w-32 flex-shrink-0">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-md relative`}
      >
        {completed ? <CheckCircle2 className="w-5 h-5" /> : icon}
        {current && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" />
        )}
      </div>
      <div className="text-[10px] text-gray-500 mt-1.5">{subtitle}</div>
      <div className="text-xs font-semibold text-gray-900 text-center truncate w-full">
        {title}
      </div>
    </div>
  );
}

function ApproverNode({ step }: { step: WorkflowStepProgress }) {
  const completed = step.isCompleted;
  const current = step.isCurrent;
  const color = completed
    ? "from-green-500 to-green-700"
    : current
      ? "from-amber-500 to-amber-700"
      : "from-gray-300 to-gray-400";

  return (
    <>
      <Arrow active={completed} />
      <div className="flex flex-col items-center w-32 flex-shrink-0">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-md relative`}
        >
          {completed ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : current ? (
            <Clock className="w-5 h-5" />
          ) : (
            <span className="text-xs font-bold">{step.order + 1}</span>
          )}
          {current && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" />
          )}
        </div>
        <div className="text-[10px] text-gray-500 mt-1.5">Дунд шат</div>
        <div className="text-xs font-semibold text-gray-900 text-center w-full truncate">
          {step.name}
        </div>
        <div className="text-[10px] text-gray-500 text-center truncate w-full">
          {completed && step.approvedByName
            ? `✓ ${step.approvedByName}`
            : step.approverNames.slice(0, 2).join(", ")}
        </div>
      </div>
    </>
  );
}

function Arrow({ active }: { active?: boolean }) {
  return (
    <div className="flex items-center justify-center px-1 self-start mt-5">
      <ArrowRight
        className={`w-4 h-4 ${active ? "text-primary" : "text-gray-300"}`}
      />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      {children}
    </div>
  );
}
