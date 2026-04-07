"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Pencil, Trash2, Building2, Phone, Palette, Sun, Moon, Monitor,
} from "lucide-react";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleGuard } from "@/components/shared/RoleGuard";
import {
  GlassPanel, Button, Input, Textarea, Modal, ConfirmDialog, Select,
  Badge, Spinner, Table, type Column,
} from "@/components/ui";
import { TICKET_PRIORITY_LABELS, TICKET_PRIORITY_COLORS, type TicketPriority } from "@/lib/constants";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useBranding } from "@/context/BrandingContext";

const PRIORITY_OPTIONS = Object.entries(TICKET_PRIORITY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// ── Types ──────────────────────────────────────────────────────────

interface CallTypeConfig {
  id: string;
  code: string;
  label: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  defaultPriority: string;
}

interface Company {
  id: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  ticketCount: number;
  userCount: number;
  createdAt: string;
}

type Tab = "companies" | "callTypes" | "branding" | "appearance";

// ── Main page ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("companies");

  const tabs: { id: Tab; label: string; icon: React.ReactNode; superAdminOnly?: boolean }[] = [
    { id: "companies",   label: "Компаниуд",      icon: <Building2 className="w-4 h-4" /> },
    { id: "callTypes",   label: "Дуудлагын төрөл", icon: <Phone className="w-4 h-4" /> },
    { id: "appearance",  label: "Харагдах байдал", icon: <Palette className="w-4 h-4" /> },
    { id: "branding",    label: "Брэнд",           icon: <Monitor className="w-4 h-4" />, superAdminOnly: true },
  ].filter(t => !t.superAdminOnly || isSuperAdmin);

  return (
    <RoleGuard roles={["SuperAdmin", "Admin"]}>
      <PageHeader title="Тохиргоо" description="Системийн тохиргоог удирдах" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "companies"  && <CompaniesTab />}
      {activeTab === "callTypes"  && <CallTypesTab />}
      {activeTab === "appearance" && <AppearanceTab />}
      {activeTab === "branding"   && isSuperAdmin && <BrandingTab />}
    </RoleGuard>
  );
}

// ── Companies tab ──────────────────────────────────────────────────

function CompaniesTab() {
  const { role } = useAuth();
  const isSuperAdmin = role === "SuperAdmin";

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: "", description: "", phone: "", email: "", address: "", isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<Company[]>("/companies/manage");
    if (res.success && res.data) setCompanies(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", phone: "", email: "", address: "", isActive: true });
    setModalOpen(true);
  };

  const openEdit = (c: Company) => {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description ?? "",
      phone: c.phone ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      isActive: c.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Нэр оруулна уу"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        isActive: form.isActive,
      };

      let res;
      if (editing) {
        res = await api.put<Company>(`/companies/${editing.id}`, payload);
      } else {
        res = await api.post<Company>("/companies", payload);
      }

      if (res.success) {
        toast.success(editing ? "Амжилттай шинэчлэгдлээ" : "Компани нэмэгдлээ");
        setModalOpen(false);
        load();
      } else {
        toast.error(res.message ?? "Алдаа гарлаа");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/companies/${deleteTarget.id}`);
      if (res.success) {
        toast.success("Компани устгагдлаа");
        setDeleteTarget(null);
        load();
      } else {
        toast.error(res.message ?? "Устгах боломжгүй");
      }
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Company>[] = [
    {
      key: "name",
      header: "Нэр",
      render: (c) => (
        <div>
          <p className="font-medium text-gray-900 text-sm">{c.name}</p>
          {c.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "phone",
      header: "Холбоо барих",
      render: (c) => (
        <div className="text-xs text-gray-600 space-y-0.5">
          {c.phone && <p>{c.phone}</p>}
          {c.email && <p>{c.email}</p>}
          {!c.phone && !c.email && <span className="text-gray-300">—</span>}
        </div>
      ),
    },
    {
      key: "address",
      header: "Хаяг",
      render: (c) => (
        <span className="text-xs text-gray-500">{c.address || "—"}</span>
      ),
    },
    {
      key: "ticketCount",
      header: "Тикет",
      align: "right" as const,
      render: (c) => <span className="text-sm font-medium text-gray-700">{c.ticketCount}</span>,
    },
    {
      key: "userCount",
      header: "Хэрэглэгч",
      align: "right" as const,
      render: (c) => <span className="text-sm font-medium text-gray-700">{c.userCount}</span>,
    },
    {
      key: "isActive",
      header: "Төлөв",
      render: (c) => (
        <Badge variant="custom" size="sm"
          className={c.isActive
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-gray-50 text-gray-500 border-gray-200"
          }>
          {c.isActive ? "Идэвхтэй" : "Идэвхгүй"}
        </Badge>
      ),
    },
    {
      key: "id",
      header: "",
      align: "right" as const,
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(c)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
            title="Засах">
            <Pencil className="w-4 h-4" />
          </button>
          {isSuperAdmin && (
            <button onClick={() => setDeleteTarget(c)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Устгах">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Нийт {companies.length} компани</p>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
          Компани нэмэх
        </Button>
      </div>

      <GlassPanel padding="none">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <Table
            columns={columns}
            data={companies}
            rowKey={(c) => c.id}
            emptyMessage="Компани байхгүй байна"
          />
        )}
      </GlassPanel>

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Компани засах" : "Компани нэмэх"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Болих</Button>
            <Button onClick={handleSave} loading={saving}>Хадгалах</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Нэр *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Компанийн нэр"
          />
          <Textarea
            label="Тайлбар"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Товч тайлбар"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Утас"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+976 xxxxxxxx"
            />
            <Input
              label="Имэйл"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="info@company.mn"
            />
          </div>
          <Input
            label="Хаяг"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Хот, дүүрэг, байр..."
          />
          {editing && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">Идэвхтэй</span>
            </label>
          )}
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Компани устгах"
        description={`"${deleteTarget?.name}" компанийг устгах уу? Тикет эсвэл хэрэглэгчтэй бол устгах боломжгүй.`}
      />
    </>
  );
}

// ── CallTypes tab ──────────────────────────────────────────────────

function CallTypesTab() {
  const { role } = useAuth();
  const isSuperAdmin = role === "SuperAdmin";

  const [callTypes, setCallTypes] = useState<CallTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CallTypeConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CallTypeConfig | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    code: "", label: "", description: "", isActive: true, sortOrder: 0, defaultPriority: "Medium",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<CallTypeConfig[]>("/settings/call-types");
    if (res.success && res.data) setCallTypes(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", label: "", description: "", isActive: true, sortOrder: callTypes.length, defaultPriority: "Medium" });
    setModalOpen(true);
  };

  const openEdit = (ct: CallTypeConfig) => {
    setEditing(ct);
    setForm({
      code: ct.code,
      label: ct.label,
      description: ct.description ?? "",
      isActive: ct.isActive,
      sortOrder: ct.sortOrder,
      defaultPriority: ct.defaultPriority ?? "Medium",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.label.trim()) { toast.error("Нэр оруулна уу"); return; }
    if (!editing && !form.code.trim()) { toast.error("Код оруулна уу"); return; }
    setSaving(true);
    try {
      let res;
      if (editing) {
        res = await api.put<CallTypeConfig>(`/settings/call-types/${editing.id}`, {
          label: form.label.trim(),
          description: form.description.trim() || null,
          isActive: form.isActive,
          sortOrder: form.sortOrder,
          defaultPriority: form.defaultPriority,
        });
      } else {
        res = await api.post<CallTypeConfig>("/settings/call-types", {
          code: form.code.trim(),
          label: form.label.trim(),
          description: form.description.trim() || null,
          sortOrder: form.sortOrder,
          defaultPriority: form.defaultPriority,
        });
      }

      if (res.success) {
        toast.success(editing ? "Амжилттай шинэчлэгдлээ" : "Дуудлагын төрөл нэмэгдлээ");
        setModalOpen(false);
        load();
      } else {
        toast.error(res.message ?? "Алдаа гарлаа");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/settings/call-types/${deleteTarget.id}`);
      if (res.success) {
        toast.success("Устгагдлаа");
        setDeleteTarget(null);
        load();
      } else {
        toast.error(res.message ?? "Устгах боломжгүй");
      }
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<CallTypeConfig>[] = [
    {
      key: "sortOrder",
      header: "#",
      width: "w-12",
      render: (ct) => <span className="text-xs text-gray-400 font-mono">{ct.sortOrder}</span>,
    },
    {
      key: "label",
      header: "Нэр",
      render: (ct) => (
        <div>
          <p className="font-medium text-gray-900 text-sm">{ct.label}</p>
          {ct.description && (
            <p className="text-xs text-gray-400 mt-0.5">{ct.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "code",
      header: "Код",
      render: (ct) => (
        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
          {ct.code}
        </span>
      ),
    },
    {
      key: "defaultPriority",
      header: "Анхдагч зэрэглэл",
      render: (ct) => (
        <Badge variant="custom" size="sm"
          className={TICKET_PRIORITY_COLORS[ct.defaultPriority as TicketPriority] ?? "bg-gray-50 text-gray-600 border-gray-200"}>
          {TICKET_PRIORITY_LABELS[ct.defaultPriority as TicketPriority] ?? ct.defaultPriority}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "Төлөв",
      render: (ct) => (
        <Badge variant="custom" size="sm"
          className={ct.isActive
            ? "bg-green-50 text-green-700 border-green-200"
            : "bg-gray-50 text-gray-500 border-gray-200"
          }>
          {ct.isActive ? "Идэвхтэй" : "Идэвхгүй"}
        </Badge>
      ),
    },
    {
      key: "id",
      header: "",
      align: "right" as const,
      render: (ct) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openEdit(ct)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
            title="Засах">
            <Pencil className="w-4 h-4" />
          </button>
          {isSuperAdmin && (
            <button onClick={() => setDeleteTarget(ct)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Устгах">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Нийт {callTypes.length} төрөл</p>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
          Дуудлагын төрөл нэмэх
        </Button>
      </div>

      <GlassPanel padding="none">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : (
          <Table
            columns={columns}
            data={callTypes}
            rowKey={(ct) => ct.id}
            emptyMessage="Дуудлагын төрөл байхгүй"
          />
        )}
      </GlassPanel>

      {/* Create/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Дуудлагын төрөл засах" : "Дуудлагын төрөл нэмэх"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Болих</Button>
            <Button onClick={handleSave} loading={saving}>Хадгалах</Button>
          </>
        }
      >
        <div className="space-y-4">
          {!editing && (
            <div>
              <Input
                label="Код *"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\s/g, "") })}
                placeholder="жнь: OnSite"
              />
              <p className="text-xs text-gray-400 mt-1">
                Тикетэд хадгалагдах дотоод код. Үүсгэсний дараа өөрчлөх боломжгүй.
              </p>
            </div>
          )}
          <Input
            label="Нэр *"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="жнь: Газар дээр"
          />
          <Input
            label="Тайлбар"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Товч тайлбар (заавал биш)"
          />
          <Select
            label="Анхдагч зэрэглэл *"
            options={PRIORITY_OPTIONS}
            value={form.defaultPriority}
            onChange={(e) => setForm({ ...form, defaultPriority: e.target.value })}
          />
          <Input
            label="Дараалал"
            type="number"
            value={form.sortOrder.toString()}
            onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
          />
          {editing && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">Идэвхтэй</span>
            </label>
          )}
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Дуудлагын төрөл устгах"
        description={`"${deleteTarget?.label}" төрлийг устгах уу? Тикетэд ашиглагдсан бол устгах боломжгүй.`}
      />
    </>
  );
}

// ── Appearance tab (all roles) ──────────────────────────────────────

function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  const options = [
    {
      id: "light" as const,
      label: "Цайвар",
      description: "Цагаан дэвсгэртэй, тод байдал",
      icon: <Sun className="w-6 h-6 text-amber-500" />,
    },
    {
      id: "dark" as const,
      label: "Харанхуй",
      description: "Нүдэнд тааламжтай, бага гэрлийн горим",
      icon: <Moon className="w-6 h-6 text-indigo-400" />,
    },
  ];

  return (
    <GlassPanel>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Харагдах байдал</h3>
      <p className="text-xs text-gray-500 mb-5">Системийн дэвсгэр өнгийг сонгоно уу</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setTheme(opt.id)}
            className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center ${
              theme === opt.id
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-gray-200 hover:border-gray-300 bg-transparent"
            }`}
          >
            {opt.icon}
            <div>
              <p className={`text-sm font-semibold ${theme === opt.id ? "text-primary" : "text-gray-700"}`}>
                {opt.label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
            </div>
            {theme === opt.id && (
              <div className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
    </GlassPanel>
  );
}

// ── Branding tab (SuperAdmin only) ─────────────────────────────────

function BrandingTab() {
  const { companyName, companySubtitle, logoText, refresh } = useBranding();
  const [form, setForm] = useState({
    companyName: "",
    companySubtitle: "",
    logoText: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ companyName, companySubtitle, logoText });
  }, [companyName, companySubtitle, logoText]);

  const handleSave = async () => {
    if (!form.companyName.trim()) { toast.error("Компанийн нэр оруулна уу"); return; }
    if (!form.logoText.trim())    { toast.error("Лого текст оруулна уу"); return; }

    setSaving(true);
    const res = await api.put("/settings/branding", {
      companyName: form.companyName.trim(),
      companySubtitle: form.companySubtitle.trim(),
      logoText: form.logoText.trim().slice(0, 3),
    });
    if (res.success) {
      await refresh();
      toast.success("Брэнд мэдээлэл хадгалагдлаа");
    } else {
      toast.error(res.message ?? "Алдаа гарлаа");
    }
    setSaving(false);
  };

  return (
    <GlassPanel>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Брэнд тохиргоо</h3>
      <p className="text-xs text-gray-500 mb-5">
        Sidebar дахь лого болон компанийн нэрийг тохируулна уу
      </p>

      <div className="space-y-4 max-w-sm">
        {/* Preview */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary border border-primary/20">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-sm">
            {form.logoText || "BG"}
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">{form.companyName || "НЭРГҮЙ"}</p>
            <p className="text-white/50 text-[10px] font-medium tracking-wider">{form.companySubtitle}</p>
          </div>
        </div>

        <Input
          label="Компанийн нэр"
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          placeholder="BISHRELT"
        />
        <Input
          label="Дэд нэр"
          value={form.companySubtitle}
          onChange={(e) => setForm({ ...form, companySubtitle: e.target.value })}
          placeholder="GROUP"
        />
        <div>
          <Input
            label="Лого текст (1-3 үсэг)"
            value={form.logoText}
            onChange={(e) => setForm({ ...form, logoText: e.target.value.slice(0, 3) })}
            placeholder="BG"
          />
          <p className="text-xs text-gray-400 mt-1">Зураг байхгүй үед харагдах товч нэр</p>
        </div>

        <Button onClick={handleSave} loading={saving}>
          Хадгалах
        </Button>
      </div>
    </GlassPanel>
  );
}
