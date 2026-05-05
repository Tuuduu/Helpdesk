"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeftRight, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  GlassPanel,
  Button,
  SearchableSelect,
  Textarea,
  Spinner,
} from "@/components/ui";
import type {
  ComputerResponse,
  CreateTransferRequestRequest,
  TransferRequestResponse,
} from "@/types/computer";
import type { PagedResult } from "@/types/api";

interface CompanyOption {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  fullName: string;
  position?: string;
  companyId: string;
  departmentName?: string;
}

export default function CreateTransferPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [computer, setComputer] = useState<ComputerResponse | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);

  const [toCompanyId, setToCompanyId] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [reason, setReason] = useState("");

  // Initial load: computer + companies. Default target company to computer's own.
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [cRes, compRes] = await Promise.all([
      api.get<ComputerResponse>(`/computers/${id}`),
      api.get<CompanyOption[]>("/companies"),
    ]);
    if (cRes.success && cRes.data) {
      setComputer(cRes.data);
      setToCompanyId(cRes.data.companyId);
    } else {
      toast.error(cRes.errors?.[0] || "Компьютер олдсонгүй");
    }
    if (compRes.success && compRes.data) setCompanies(compRes.data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load receiver candidates when target company changes
  useEffect(() => {
    if (!toCompanyId || !computer) {
      setUsers([]);
      return;
    }
    api
      .get<PagedResult<UserOption>>("/users", {
        companyId: toCompanyId,
        pageSize: 200,
        isActive: true,
      })
      .then((res) => {
        if (res.success && res.data) {
          // Exclude current owner from receiver candidates
          setUsers(res.data.items.filter((u) => u.id !== computer.ownerUserId));
        } else {
          setUsers([]);
        }
      });
  }, [toCompanyId, computer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const body: CreateTransferRequestRequest = {
      computerId: id,
      toUserId,
      reason,
    };

    const res = await api.post<TransferRequestResponse>(
      "/computer-transfers",
      body
    );

    if (res.success && res.data) {
      toast.success("Шилжүүлгийн хүсэлт илгээгдлээ");
      router.push("/transfers");
    } else {
      toast.error(res.errors?.[0] || "Алдаа гарлаа");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!computer) return null;

  // Guard: user must be the owner
  if (computer.ownerUserId !== user?.id) {
    return (
      <GlassPanel>
        <div className="text-center py-10">
          <p className="text-sm text-gray-700">
            Зөвхөн өөрийн эзэмшилд байгаа компьютер дээр шилжүүлэх хүсэлт
            үүсгэх боломжтой.
          </p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => router.push("/my-computers")}
          >
            Буцах
          </Button>
        </div>
      </GlassPanel>
    );
  }

  return (
    <>
      <PageHeader
        title="Шилжүүлгийн хүсэлт"
        description={`${computer.assetCode} · ${computer.brand} ${computer.model}`}
        actions={
          <Button
            variant="ghost"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.back()}
          >
            Буцах
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <GlassPanel>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-5 text-xs text-blue-900">
            <b>Анхааруулга:</b> Хүсэлт илгээсний дараа компьютер{" "}
            <b>InTransfer</b> төлөвт орох ба МТ-ийн нярав болон хүлээн авагч
            хүний батлах хүртэл шилжүүлэг бүртгэгдэхгүй.
          </div>

          <div className="space-y-4">
            <SearchableSelect
              label="Компани"
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
              value={toCompanyId}
              onChange={(val) => {
                setToCompanyId(val);
                setToUserId("");
              }}
              placeholder="Компани сонгох"
              emptyMessage="Компани олдсонгүй"
              required
            />

            <SearchableSelect
              label="Хүлээн авагч ажилтан"
              options={users.map((u) => ({
                value: u.id,
                label: u.fullName,
                sublabel: [u.departmentName, u.position]
                  .filter(Boolean)
                  .join(" · "),
              }))}
              value={toUserId}
              onChange={setToUserId}
              placeholder={
                toCompanyId ? "Ажилтан сонгох (хайж болно)" : "Эхлээд компани сонгоно уу"
              }
              emptyMessage="Ажилтан олдсонгүй"
              disabled={!toCompanyId}
              required
            />

            <Textarea
              label="Шалтгаан"
              placeholder="Жишээ: Шинээр томилогдсон албан тушаалтай ажилтанд хариуцуулах"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button
              type="submit"
              loading={submitting}
              icon={<ArrowLeftRight className="w-4 h-4" />}
            >
              Хүсэлт илгээх
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              Цуцлах
            </Button>
          </div>
        </GlassPanel>
      </form>
    </>
  );
}
