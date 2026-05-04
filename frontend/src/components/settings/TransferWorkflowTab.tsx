"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Save,
  ArrowRight,
  User,
  CheckCircle2,
  Inbox,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  GlassPanel,
  Button,
  Input,
  Select,
  Spinner,
  Badge,
} from "@/components/ui";
import type {
  TransferWorkflowStep,
  WorkflowStepInput,
  SaveWorkflowRequest,
  WorkflowTypeValue,
} from "@/types/transferWorkflow";

const WORKFLOW_TYPE_LABELS: Record<WorkflowTypeValue, string> = {
  Transfer: "Шилжүүлэг",
  Repair: "Засвар",
  Retirement: "Акт хасагдалт",
};

interface CompanyOption {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  fullName: string;
  position?: string;
}

interface PagedUsers {
  items: UserOption[];
}

export function TransferWorkflowTab() {
  const { isSuperAdmin } = useAuth();

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [workflowType, setWorkflowType] = useState<WorkflowTypeValue>("Transfer");
  const [steps, setSteps] = useState<WorkflowStepInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Companies load
  useEffect(() => {
    api.get<CompanyOption[]>("/companies").then((res) => {
      if (res.success && res.data) {
        setCompanies(res.data);
        if (!companyId && res.data.length > 0) setCompanyId(res.data[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Users load when company changes
  useEffect(() => {
    if (!companyId) {
      setUsers([]);
      return;
    }
    api
      .get<PagedUsers>("/users", {
        companyId,
        pageSize: 200,
        isActive: true,
      })
      .then((res) => {
        if (res.success && res.data) setUsers(res.data.items);
      });
  }, [companyId]);

  // Workflow load when company / type changes
  const fetchWorkflow = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const res = await api.get<TransferWorkflowStep[]>("/transfer-workflows", {
      companyId,
      type: workflowType,
    });
    if (res.success && res.data) {
      setSteps(
        res.data.map((s) => ({
          name: s.name,
          approverUserIds: s.approvers.map((a) => a.userId),
        }))
      );
    } else {
      setSteps([]);
    }
    setLoading(false);
  }, [companyId, workflowType]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { name: prev.length === 0 ? "Нярвын батлах" : "Менежерийн батлах", approverUserIds: [] },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStepName = (index: number, name: string) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, name } : s)));
  };

  const toggleApprover = (stepIndex: number, userId: string) => {
    setSteps((prev) =>
      prev.map((s, i) => {
        if (i !== stepIndex) return s;
        const has = s.approverUserIds.includes(userId);
        return {
          ...s,
          approverUserIds: has
            ? s.approverUserIds.filter((id) => id !== userId)
            : [...s.approverUserIds, userId],
        };
      })
    );
  };

  const handleSave = async () => {
    if (!companyId) return;
    for (const s of steps) {
      if (!s.name.trim()) {
        toast.error("Алхам бүрд нэр оруулна уу");
        return;
      }
      if (s.approverUserIds.length === 0) {
        toast.error(`'${s.name}' алхамд дор хаяж нэг батлагч сонгоно уу`);
        return;
      }
    }
    setSaving(true);
    const body: SaveWorkflowRequest = { companyId, workflowType, steps };
    const res = await api.put<TransferWorkflowStep[]>(
      "/transfer-workflows",
      body
    );
    if (res.success) {
      toast.success("Workflow хадгалагдлаа");
      fetchWorkflow();
    } else {
      toast.error(res.errors?.[0] || "Алдаа");
    }
    setSaving(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="w-60">
          <Select
            label="Компани"
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            label="Урсгалын төрөл"
            options={(Object.keys(WORKFLOW_TYPE_LABELS) as WorkflowTypeValue[]).map(
              (t) => ({ value: t, label: WORKFLOW_TYPE_LABELS[t] })
            )}
            value={workflowType}
            onChange={(e) => setWorkflowType(e.target.value as WorkflowTypeValue)}
          />
        </div>
        {isSuperAdmin && (
          <Button
            icon={<Save className="w-4 h-4" />}
            onClick={handleSave}
            loading={saving}
          >
            Хадгалах
          </Button>
        )}
      </div>

      {!isSuperAdmin && (
        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          Зөвхөн SuperAdmin workflow засах эрхтэй (доорх форм read-only).
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Topology preview */}
          <GlassPanel className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Шилжүүлгийн урсгал
            </h3>
            <TopologyView steps={steps} users={users} />
          </GlassPanel>

          {/* Step editor */}
          <GlassPanel>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Дунд шатны алхмууд ({steps.length})
              </h3>
              {isSuperAdmin && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={addStep}
                  disabled={steps.length >= 5}
                >
                  Алхам нэмэх
                </Button>
              )}
            </div>

            {steps.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                Алхам тохируулаагүй байна. Шилжүүлгийн хүсэлт User-аас Receiver
                руу шууд очно.
              </div>
            ) : (
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <div
                    key={i}
                    className="bg-white/50 border border-gray-100 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="info">{`#${i + 1}`}</Badge>
                      <Input
                        value={step.name}
                        onChange={(e) => updateStepName(i, e.target.value)}
                        placeholder="Алхмын нэр"
                        disabled={!isSuperAdmin}
                        className="flex-1"
                      />
                      {isSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => removeStep(i)}
                        />
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mb-2">
                      Батлагчдыг сонгоно ({step.approverUserIds.length} сонгосон)
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                      {users.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">
                          Эхлээд компани сонгоно уу
                        </span>
                      ) : (
                        users.map((u) => {
                          const selected = step.approverUserIds.includes(u.id);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              disabled={!isSuperAdmin}
                              onClick={() => toggleApprover(i, u.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                selected
                                  ? "bg-primary text-white border-primary"
                                  : "bg-white text-gray-700 border-gray-200 hover:border-primary"
                              } ${!isSuperAdmin ? "opacity-60 cursor-default" : ""}`}
                            >
                              {selected && (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              {u.fullName}
                              {u.position && (
                                <span className="opacity-70">
                                  · {u.position}
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </>
      )}
    </>
  );
}

function TopologyView({
  steps,
  users,
}: {
  steps: WorkflowStepInput[];
  users: UserOption[];
}) {
  const userMap = new Map(users.map((u) => [u.id, u.fullName]));

  return (
    <div className="overflow-x-auto">
      <div className="flex items-stretch gap-2 min-w-max py-3">
        {/* Requester node */}
        <Node
          icon={<User className="w-5 h-5" />}
          title="Хүсэлт гаргагч"
          color="from-gray-500 to-gray-700"
          subtitle="Эзэмшигч"
        />

        {steps.map((step, i) => (
          <ArrowAndNode
            key={i}
            step={step}
            stepIndex={i}
            userMap={userMap}
          />
        ))}

        {/* Arrow before receiver */}
        <ArrowOnly />

        {/* Receiver node */}
        <Node
          icon={<Inbox className="w-5 h-5" />}
          title="Хүлээн авагч"
          color="from-blue-500 to-blue-700"
          subtitle="ToUser"
        />
      </div>
    </div>
  );
}

function Node({
  icon,
  title,
  subtitle,
  color,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color: string;
  body?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center w-44 flex-shrink-0">
      <div
        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-md`}
      >
        {icon}
      </div>
      <div className="text-xs text-gray-500 mt-2">{subtitle}</div>
      <div className="text-sm font-semibold text-gray-900 text-center">
        {title}
      </div>
      {body && <div className="mt-2 w-full">{body}</div>}
    </div>
  );
}

function ArrowOnly() {
  return (
    <div className="flex items-center justify-center px-2 self-start mt-7">
      <ArrowRight className="w-5 h-5 text-primary" />
    </div>
  );
}

function ArrowAndNode({
  step,
  stepIndex,
  userMap,
}: {
  step: WorkflowStepInput;
  stepIndex: number;
  userMap: Map<string, string>;
}) {
  return (
    <>
      <ArrowOnly />
      <Node
        icon={
          <span className="text-base font-bold">{`${stepIndex + 1}`}</span>
        }
        title={step.name || `Алхам ${stepIndex + 1}`}
        subtitle="Дунд шат"
        color="from-purple-500 to-primary"
        body={
          <div className="text-[10px] text-center text-gray-600 max-h-12 overflow-hidden">
            {step.approverUserIds.length === 0 ? (
              <span className="text-amber-600 italic">
                Батлагч сонгоогүй
              </span>
            ) : (
              step.approverUserIds
                .map((id) => userMap.get(id) ?? "?")
                .join(", ")
            )}
          </div>
        }
      />
    </>
  );
}
