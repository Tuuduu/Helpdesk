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
  Wrench,
  Archive,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  GlassPanel,
  Button,
  Badge,
  Textarea,
  Spinner,
} from "@/components/ui";
import {
  PROCESS_TYPE_LABELS,
  PROCESS_STATUS_LABELS,
  PROCESS_STATUS_COLORS,
  type ProcessRequestResponse,
  type ProcessRequestStatus,
} from "@/types/computerProcess";
import type { WorkflowStepProgress } from "@/types/computer";

function endpointFor(type: string, suffix = "") {
  const base = type === "Repair" ? "computer-repairs" : "computer-retirements";
  return `/${base}${suffix}`;
}

export default function ProcessDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();

  const [data, setData] = useState<ProcessRequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [note, setNote] = useState("");
  // Type-ыг detail хариунаас авна (Repair эсвэл Retirement)

  // Эхлээд аль endpoint-аар байгаа эсэхийг тогтоохын тулд хоёуланг туршина
  const fetchData = useCallback(async () => {
    setLoading(true);
    const r1 = await api.get<ProcessRequestResponse>(`/computer-repairs/${id}`);
    if (r1.success && r1.data) {
      setData(r1.data);
      setLoading(false);
      return;
    }
    const r2 = await api.get<ProcessRequestResponse>(
      `/computer-retirements/${id}`
    );
    if (r2.success && r2.data) {
      setData(r2.data);
    } else {
      toast.error(r2.errors?.[0] || r1.errors?.[0] || "Хүсэлт олдсонгүй");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const act = async (action: "approve-step" | "reject-step") => {
    if (!data) return;
    setActing(true);
    const url = endpointFor(data.type, `/${id}/${action}`);
    const res = await api.post<ProcessRequestResponse>(url, {
      note: note.trim() || undefined,
    });
    if (res.success && res.data) {
      toast.success("Боловсруулагдлаа");
      router.push("/processes");
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

  if (!data) return null;

  const status = data.status as ProcessRequestStatus;
  const currentStep = data.workflowSteps.find((s) => s.isCurrent);
  const canApproveStep =
    status === "PendingApproval" &&
    !!currentStep &&
    !!user &&
    currentStep.approverUserIds.includes(user.id);

  const TypeIcon = data.type === "Repair" ? Wrench : Archive;

  return (
    <>
      <PageHeader
        title={`${PROCESS_TYPE_LABELS[data.type]}: ${data.assetCode}`}
        description={data.computerLabel}
        actions={
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.push("/processes")}
          >
            Буцах
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassPanel className="lg:col-span-2">
          <div className="flex items-start justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <TypeIcon className="w-4 h-4 text-primary" />
              Хүсэлтийн дэлгэрэнгүй
            </h3>
            <Badge variant="custom" className={PROCESS_STATUS_COLORS[status]}>
              {PROCESS_STATUS_LABELS[status]}
            </Badge>
          </div>

          <WorkflowProgressView
            steps={data.workflowSteps}
            requestedByName={data.requestedByName}
            type={data.type}
            status={status}
          />

          <div className="space-y-3 text-sm mt-5">
            <Field label="Тайлбар">
              <p className="text-gray-700 whitespace-pre-wrap">
                {data.description}
              </p>
            </Field>
            <Field label="Хүсэлт гаргасан">
              <div className="flex items-center gap-2 text-gray-700">
                <UserIcon className="w-3.5 h-3.5" />
                {data.requestedByName}
                <span className="text-gray-400">·</span>
                <Calendar className="w-3.5 h-3.5" />
                {formatDateTime(data.createdAt)}
              </div>
            </Field>

            {data.completedAt && (
              <Field label="Дууссан">
                <div className="text-gray-700">
                  {formatDateTime(data.completedAt)}
                </div>
                {data.completionNote && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    {data.completionNote}
                  </p>
                )}
              </Field>
            )}
          </div>
        </GlassPanel>

        <GlassPanel>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Үйлдэл</h3>

          {!canApproveStep ? (
            <p className="text-xs text-gray-500 italic">
              Танд энэ хүсэлт дээр одоогоор үйлдэл хийх эрх алга.
            </p>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-600">
                Та <b>{currentStep?.name}</b> алхмыг батлах эсвэл татгалзах
                боломжтой
              </p>
              <Textarea
                label="Тэмдэглэл (заавал биш)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
              <Button
                className="w-full"
                icon={<Check className="w-4 h-4" />}
                loading={acting}
                onClick={() => act("approve-step")}
              >
                {currentStep && data.workflowSteps.indexOf(currentStep) === data.workflowSteps.length - 1
                  ? data.type === "Repair"
                    ? "Засвар дуусгах"
                    : "Акт хасагдалт батлах"
                  : "Зөвшөөрөх"}
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
        </GlassPanel>
      </div>
    </>
  );
}

function WorkflowProgressView({
  steps,
  requestedByName,
  type,
  status,
}: {
  steps: WorkflowStepProgress[];
  requestedByName: string;
  type: "Repair" | "Retirement";
  status: ProcessRequestStatus;
}) {
  const completed = status === "Completed";
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex items-stretch gap-2 min-w-max">
        <FlowNode
          icon={<UserIcon className="w-4 h-4" />}
          title={requestedByName}
          subtitle="Хүсэлт гаргасан"
          color="from-gray-500 to-gray-700"
          completed
        />

        {steps.map((s) => (
          <ApproverNode key={s.order} step={s} />
        ))}

        {completed && (
          <>
            <Arrow active />
            <FlowNode
              icon={<CheckCircle2 className="w-4 h-4" />}
              title={type === "Repair" ? "Засвар хийгдсэн" : "Акт хасагдсан"}
              subtitle="Дууссан"
              color="from-green-500 to-green-700"
              completed
            />
          </>
        )}
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
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color: string;
  completed?: boolean;
}) {
  return (
    <div className="flex flex-col items-center w-32 flex-shrink-0">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-md`}
      >
        {completed ? <CheckCircle2 className="w-5 h-5" /> : icon}
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
        <div className="text-[10px] text-gray-500 mt-1.5">Алхам</div>
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
