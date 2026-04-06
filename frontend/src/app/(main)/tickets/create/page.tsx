"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { CALL_TYPE_LABELS, type CallType } from "@/lib/constants";
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
import toast from "react-hot-toast";

interface CompanyOption {
  id: string;
  name: string;
}

const CALL_TYPE_OPTIONS = Object.entries(CALL_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

export default function TicketCreatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);

  const [isGuest, setIsGuest] = useState(false);
  const [callType, setCallType] = useState<CallType>("PhoneCall");
  const [companyId, setCompanyId] = useState(user?.companyId ?? "");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [position, setPosition] = useState(user?.position ?? "");
  const [computerNumber, setComputerNumber] = useState(user?.computerNumber ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function loadCompanies() {
      const res = await api.get<CompanyOption[]>("/companies");
      if (res.success && res.data) {
        setCompanies(res.data);
      }
    }
    loadCompanies();
  }, []);

  // Pre-fill from logged-in user when not guest
  useEffect(() => {
    if (!isGuest && user) {
      setFullName(user.fullName);
      setPosition(user.position ?? "");
      setComputerNumber(user.computerNumber ?? "");
      setPhoneNumber(user.phoneNumber ?? "");
      setCompanyId(user.companyId);
    } else if (isGuest) {
      setFullName("");
      setPosition("");
      setComputerNumber("");
      setPhoneNumber("");
      setCompanyId("");
    }
  }, [isGuest, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const body: CreateTicketRequest = {
      callType,
      companyId,
      fullName,
      position: position || undefined,
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

              <Select
                label="Дуудлагын төрөл"
                options={CALL_TYPE_OPTIONS}
                value={callType}
                onChange={(e) => setCallType(e.target.value as CallType)}
                required
              />

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
