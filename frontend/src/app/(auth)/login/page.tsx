"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, Monitor, Briefcase, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { GlassPanel, Button, Input, Select, Textarea } from "@/components/ui";
import { Logo } from "@/components/layout/Logo";
import Link from "next/link";
import toast from "react-hot-toast";

interface CompanyOption { id: string; name: string; }
interface CallTypeOption { value: string; label: string; defaultPriority: string; }
interface PublicTicketResponse { ticketNumber: string; title: string; companyName: string; status: string; }

type Tab = "login" | "ticket";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("login");

  if (isAuthenticated) {
    router.push("/dashboard");
    return null;
  }

  return (
    <GlassPanel variant="elevated" padding="lg" className="w-full">
      <div className="flex justify-center mb-5">
        <Logo variant="full" theme="light" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab("login")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "login"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Нэвтрэх
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ticket")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "ticket"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Тикет захиалах
        </button>
      </div>

      {activeTab === "login" ? (
        <LoginForm login={login} router={router} />
      ) : (
        <PublicTicketForm />
      )}
    </GlassPanel>
  );
}

// ── Login form ─────────────────────────────────────────────────────

function LoginForm({
  login,
  router,
}: {
  login: ReturnType<typeof useAuth>["login"];
  router: ReturnType<typeof useRouter>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await login({ email, password });
    if (result.success) {
      toast.success("Амжилттай нэвтэрлээ");
      router.push("/dashboard");
    } else {
      toast.error(result.error || "Нэвтрэх амжилтгүй");
    }
    setLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Имэйл"
          type="email"
          placeholder="email@bishrelt.mn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4 h-4" />}
          required
        />
        <Input
          label="Нууц үг"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          required
        />
        <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
          Нэвтрэх
        </Button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        Бүртгэлгүй юу?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Бүртгүүлэх
        </Link>
      </p>
    </>
  );
}

// ── Public ticket form ─────────────────────────────────────────────

function PublicTicketForm() {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [callTypes, setCallTypes] = useState<CallTypeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<PublicTicketResponse | null>(null);

  const [form, setForm] = useState({
    companyId: "",
    callType: "",
    fullName: "",
    position: "",
    phoneNumber: "",
    computerNumber: "",
    title: "",
    description: "",
  });

  useEffect(() => {
    Promise.all([
      api.get<CompanyOption[]>("/companies"),
      api.get<CallTypeOption[]>("/settings/call-types/active"),
    ]).then(([compRes, ctRes]) => {
      if (compRes.success && compRes.data) setCompanies(compRes.data);
      if (ctRes.success && ctRes.data) {
        const opts = ctRes.data.map((ct) => ({
          value: ct.value ?? (ct as unknown as { code: string }).code,
          label: ct.label,
          defaultPriority: ct.defaultPriority,
        }));
        setCallTypes(opts);
        if (opts.length > 0) setForm((f) => ({ ...f, callType: opts[0].value }));
      }
    });
  }, []);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyId) { toast.error("Компани сонгоно уу"); return; }
    if (!form.callType) { toast.error("Дуудлагын төрөл сонгоно уу"); return; }

    setLoading(true);
    const res = await api.post<PublicTicketResponse>("/tickets/public", {
      callType: form.callType,
      companyId: form.companyId,
      fullName: form.fullName,
      position: form.position || undefined,
      phoneNumber: form.phoneNumber,
      computerNumber: form.computerNumber || undefined,
      title: form.title,
      description: form.description,
    });

    if (res.success && res.data) {
      setSuccess(res.data);
    } else {
      toast.error(res.message || "Тикет үүсгэхэд алдаа гарлаа");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-green-500" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Тикет бүртгэгдлээ!</h3>
        <p className="text-sm text-gray-500 mb-4">
          Таны хүсэлт хүлээн авагдлаа. Манай инженер тантай холбоо барих болно.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 text-left mb-5 border border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">Тикетийн дугаар</span>
            <span className="font-mono font-semibold text-primary text-sm">{success.ticketNumber}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">Гарчиг</span>
            <span className="text-sm text-gray-700 max-w-[60%] text-right">{success.title}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Компани</span>
            <span className="text-sm text-gray-700">{success.companyName}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            setSuccess(null);
            setForm({ companyId: "", callType: callTypes[0]?.value ?? "", fullName: "", position: "", phoneNumber: "", computerNumber: "", title: "", description: "" });
          }}
        >
          Шинэ тикет үүсгэх
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Компани *"
          options={[
            { value: "", label: "Сонгох..." },
            ...companies.map((c) => ({ value: c.id, label: c.name })),
          ]}
          value={form.companyId}
          onChange={set("companyId")}
          required
        />
        <Select
          label="Дуудлагын төрөл *"
          options={callTypes.map((ct) => ({ value: ct.value, label: ct.label }))}
          value={form.callType}
          onChange={set("callType")}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Овог нэр *"
          placeholder="Бат-Эрдэнэ Болд"
          value={form.fullName}
          onChange={set("fullName")}
          icon={<User className="w-4 h-4" />}
          required
        />
        <Input
          label="Утас *"
          placeholder="+976 xxxxxxxx"
          value={form.phoneNumber}
          onChange={set("phoneNumber")}
          icon={<Phone className="w-4 h-4" />}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Албан тушаал"
          placeholder="Менежер..."
          value={form.position}
          onChange={set("position")}
          icon={<Briefcase className="w-4 h-4" />}
        />
        <Input
          label="Компьютерийн №"
          placeholder="PC-001"
          value={form.computerNumber}
          onChange={set("computerNumber")}
          icon={<Monitor className="w-4 h-4" />}
        />
      </div>
      <Input
        label="Гарчиг *"
        placeholder="Асуудлыг товч тайлбарлана уу"
        value={form.title}
        onChange={set("title")}
        required
      />
      <Textarea
        label="Дэлгэрэнгүй тайлбар *"
        placeholder="Асуудлыг дэлгэрэнгүй бичнэ үү..."
        value={form.description}
        onChange={set("description")}
        rows={3}
        required
      />
      <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
        Тикет илгээх
      </Button>
    </form>
  );
}
