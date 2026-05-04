"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { CALL_TYPE_LABELS, TICKET_PRIORITY_LABELS, TICKET_PRIORITY_COLORS, type TicketPriority } from "@/lib/constants";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  GlassPanel,
  Button,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import type { CreateTicketRequest } from "@/types/ticket";
import type { TicketResponse } from "@/types/ticket";
import type { ComputerListItem } from "@/types/computer";
import toast from "react-hot-toast";

interface CompanyOption {
  id: string;
  name: string;
}

interface CallTypeOption {
  value: string;
  label: string;
  defaultPriority: string;
}

interface DepartmentOption {
  id: string;
  name: string;
  companyId: string;
}

export default function TicketCreatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [callTypeOptions, setCallTypeOptions] = useState<CallTypeOption[]>([]);
  const [autoPriority, setAutoPriority] = useState("Medium");

  const [isGuest, setIsGuest] = useState(false);
  const [callType, setCallType] = useState("");
  const [companyId, setCompanyId] = useState(user?.companyId ?? "");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [position, setPosition] = useState(user?.position ?? "");
  const [department, setDepartment] = useState(user?.departmentName ?? "");
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [computerNumber, setComputerNumber] = useState(user?.computerNumber ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function loadOptions() {
      const [compRes, ctRes] = await Promise.all([
        api.get<CompanyOption[]>("/companies"),
        api.get<{ code: string; label: string; defaultPriority: string }[]>("/settings/call-types/active"),
      ]);
      if (compRes.success && compRes.data) setCompanies(compRes.data);
      if (ctRes.success && ctRes.data) {
        const opts = ctRes.data.map((ct) => ({
          value: ct.code,
          label: ct.label,
          defaultPriority: ct.defaultPriority ?? "Medium",
        }));
        setCallTypeOptions(opts);
        if (opts.length > 0) {
          setCallType(opts[0].value);
          setAutoPriority(opts[0].defaultPriority);
        }
      } else {
        const fallback = Object.entries(CALL_TYPE_LABELS).map(([value, label]) => ({
          value, label, defaultPriority: "Medium",
        }));
        setCallTypeOptions(fallback);
        setCallType(fallback[0]?.value ?? "");
        setAutoPriority("Medium");
      }
    }
    loadOptions();
  }, []);

  // Pre-fill from logged-in user when not guest
  useEffect(() => {
    if (!isGuest && user) {
      setFullName(user.fullName);
      setPosition(user.position ?? "");
      setDepartment(user.departmentName ?? "");
      setComputerNumber(user.computerNumber ?? "");
      setPhoneNumber(user.phoneNumber ?? "");
      setCompanyId(user.companyId);
    } else if (isGuest) {
      setFullName("");
      setPosition("");
      setDepartment("");
      setComputerNumber("");
      setPhoneNumber("");
      setCompanyId("");
    }
  }, [isGuest, user]);

  // Компани солигдоход тухайн компанийн хэлтсүүдийг ачаална
  useEffect(() => {
    if (!companyId) {
      setDepartments([]);
      return;
    }
    api
      .get<DepartmentOption[]>("/departments", { companyId })
      .then((res) => {
        if (res.success && res.data) setDepartments(res.data);
        else setDepartments([]);
      });
  }, [companyId]);

  // Хэрэглэгчийн бүртгэлтэй компьютер байвал domain name-ыг "Компьютерийн дугаар"-т
  // автомат бөглөнө (зочин биш үед).
  useEffect(() => {
    if (isGuest || !user) return;
    api.get<ComputerListItem[]>("/computers/me").then((res) => {
      if (!res.success || !res.data || res.data.length === 0) return;
      // domainName байгаа эхний компьютер, эс байвал AssetCode-ыг
      const first =
        res.data.find((c) => c.domainName && c.domainName.trim()) ??
        res.data[0];
      const auto = first.domainName?.trim() || first.assetCode;
      // Хэрэглэгч өөрөө юм оруулаагүй бол л автомат бөглөнө
      setComputerNumber((prev) => prev || auto);
    });
  }, [user, isGuest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const body: CreateTicketRequest = {
      callType,
      companyId,
      fullName,
      position: position || undefined,
      department: department || undefined,
      computerNumber: computerNumber || undefined,
      phoneNumber,
      title,
      description,
      isGuest,
    };

    const res = await api.post<TicketResponse>("/tickets", body);

    if (res.success && res.data) {
      toast.success("Тикет амжилттай үүсгэлээ");
      router.push(`/tickets/${res.data.id}`);
    } else {
      toast.error(res.errors?.[0] || "Алдаа гарлаа");
    }

    setLoading(false);
  };

  return (
    <>
      <PageHeader
        title="Тикет үүсгэх"
        description="Шинэ тикет бүртгэх"
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requester info */}
          <GlassPanel>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Хүсэлт гаргагчийн мэдээлэл
            </h3>

            <div className="space-y-4">
              {/* Guest toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGuest}
                  onChange={(e) => setIsGuest(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">
                  Зочин хэрэглэгч (бүртгэлгүй)
                </span>
              </label>

              <div>
                <Select
                  label="Дуудлагын төрөл"
                  options={callTypeOptions}
                  value={callType}
                  onChange={(e) => {
                    setCallType(e.target.value);
                    const selected = callTypeOptions.find((o) => o.value === e.target.value);
                    if (selected) setAutoPriority(selected.defaultPriority);
                  }}
                  required
                />
                {autoPriority && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
                    Анхдагч зэрэглэл:
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TICKET_PRIORITY_COLORS[autoPriority as TicketPriority] ?? ""}`}>
                      {TICKET_PRIORITY_LABELS[autoPriority as TicketPriority] ?? autoPriority}
                    </span>
                  </p>
                )}
              </div>

              {companies.length > 0 && (
                <Select
                  label="Компани"
                  options={companies.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  placeholder="Компани сонгох"
                  required
                />
              )}

              {/* If no companies loaded, show hidden input for companyId */}
              {companies.length === 0 && companyId && (
                <input type="hidden" value={companyId} />
              )}

              <Input
                label="Овог нэр"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Албан тушаал"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
              {departments.length > 0 ? (
                <Select
                  label="Хэлтэс"
                  options={[
                    { value: "", label: "Сонгох..." },
                    ...departments.map((d) => ({
                      value: d.name,
                      label: d.name,
                    })),
                  ]}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              ) : (
                <Input
                  label="Хэлтэс"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Жишээ: НББ"
                />
              )}
              <Input
                label="Компьютерийн дугаар"
                value={computerNumber}
                onChange={(e) => setComputerNumber(e.target.value)}
              />
              <Input
                label="Утасны дугаар"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
          </GlassPanel>

          {/* Ticket content */}
          <GlassPanel>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Тикетийн мэдээлэл
            </h3>

            <div className="space-y-4">
              <Input
                label="Гарчиг"
                placeholder="Асуудлыг товч тайлбарлана уу"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Textarea
                label="Дэлгэрэнгүй тайлбар"
                placeholder="Асуудлыг дэлгэрэнгүй бичнэ үү..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                required
              />
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
              <Button type="submit" loading={loading}>
                Тикет үүсгэх
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
              >
                Буцах
              </Button>
            </div>
          </GlassPanel>
        </div>
      </form>
    </>
  );
}
