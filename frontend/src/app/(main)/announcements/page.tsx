"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Megaphone,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleGuard } from "@/components/shared/RoleGuard";
import {
  GlassPanel,
  Button,
  Input,
  Textarea,
  Select,
  Modal,
  ConfirmDialog,
  Badge,
  Spinner,
  EmptyState,
} from "@/components/ui";
import type {
  Announcement,
  AnnouncementLevel,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
} from "@/types/announcement";
import toast from "react-hot-toast";

const LEVEL_OPTIONS: { value: AnnouncementLevel; label: string }[] = [
  { value: "info", label: "Мэдээлэл" },
  { value: "warning", label: "Анхааруулга" },
  { value: "success", label: "Амжилт" },
  { value: "danger", label: "Чухал" },
];

const LEVEL_CONFIG: Record<
  AnnouncementLevel,
  {
    label: string;
    badge: string;
    accent: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  info: {
    label: "Мэдээлэл",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    accent: "text-blue-500",
    icon: Info,
  },
  warning: {
    label: "Анхааруулга",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    accent: "text-amber-500",
    icon: AlertTriangle,
  },
  success: {
    label: "Амжилт",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    accent: "text-emerald-500",
    icon: CheckCircle2,
  },
  danger: {
    label: "Чухал",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    accent: "text-rose-500",
    icon: XCircle,
  },
};

export default function AnnouncementsPage() {
  const { isSuperAdmin, isAdminOrAbove } = useAuth();

  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    body: "",
    level: "info" as AnnouncementLevel,
    sortOrder: 0,
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<Announcement[]>("/announcements");
    if (res.success && res.data) setItems(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: "",
      body: "",
      level: "info",
      sortOrder: items.length,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setForm({
      title: a.title,
      body: a.body,
      level: a.level,
      sortOrder: a.sortOrder,
      isActive: a.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Гарчиг оруулна уу");
      return;
    }
    if (!form.body.trim()) {
      toast.error("Агуулга оруулна уу");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const body: UpdateAnnouncementRequest = {
          title: form.title.trim(),
          body: form.body.trim(),
          level: form.level,
          sortOrder: form.sortOrder,
          isActive: form.isActive,
        };
        const res = await api.put(`/announcements/${editing.id}`, body);
        if (res.success) {
          toast.success("Шинэчлэгдлээ");
          setModalOpen(false);
          load();
        } else {
          toast.error(res.errors?.[0] || "Алдаа гарлаа");
        }
      } else {
        const body: CreateAnnouncementRequest = {
          title: form.title.trim(),
          body: form.body.trim(),
          level: form.level,
          sortOrder: form.sortOrder,
        };
        const res = await api.post("/announcements", body);
        if (res.success) {
          toast.success("Мэдэгдэл нэмэгдлээ");
          setModalOpen(false);
          load();
        } else {
          toast.error(res.errors?.[0] || "Алдаа гарлаа");
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await api.delete(`/announcements/${deleteTarget.id}`);
    if (res.success) {
      toast.success("Устгагдлаа");
      setDeleteTarget(null);
      load();
    } else {
      toast.error(res.errors?.[0] || "Алдаа гарлаа");
    }
    setDeleting(false);
  };

  return (
    <RoleGuard roles={["SuperAdmin", "Admin"]}>
      <PageHeader
        title="Мэдэгдэл"
        description="Нэвтрэх хуудсанд гадны хэрэглэгчдэд харагдах зар мэдээ"
        actions={
          isAdminOrAbove && (
            <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              Мэдэгдэл нэмэх
            </Button>
          )
        }
      />

      <div className="mb-4 text-xs text-gray-500 px-1">
        Нийт {items.length} мэдэгдэл
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState message="Мэдэгдэл байхгүй — эхний мэдэгдлээ нэмж эхлээрэй" />
      ) : (
        <div className="space-y-3">
          {items.map((a) => {
            const cfg = LEVEL_CONFIG[a.level] ?? LEVEL_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <GlassPanel key={a.id} padding="md">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 ${cfg.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {a.title}
                      </h3>
                      <Badge variant="custom" size="sm" className={cfg.badge}>
                        {cfg.label}
                      </Badge>
                      {!a.isActive && (
                        <Badge variant="neutral" size="sm">
                          Идэвхгүй
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {a.body}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-2">
                      {formatDateTime(a.updatedAt || a.createdAt)}
                    </p>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(a)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                        title="Засах"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(a)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Устгах"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </GlassPanel>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Мэдэгдэл засах" : "Мэдэгдэл нэмэх"}
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Болих
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Хадгалах
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <Megaphone className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-900 leading-relaxed">
              Энэ мэдэгдэл нэвтрэх хуудсанд гадны хэрэглэгчдэд харагдана.
              Богино, ойлгомжтой бичих нь чухал.
            </p>
          </div>
          <Input
            label="Гарчиг *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Жишээ: Дуудлага хийхээс өмнө анхаарах зүйл"
          />
          <Textarea
            label="Агуулга *"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Дэлгэрэнгүй текст..."
            rows={6}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Төрөл"
              options={LEVEL_OPTIONS}
              value={form.level}
              onChange={(e) =>
                setForm({ ...form, level: e.target.value as AnnouncementLevel })
              }
            />
            <Input
              label="Дараалал"
              type="number"
              value={form.sortOrder.toString()}
              onChange={(e) =>
                setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
              }
            />
          </div>
          {editing && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-gray-700">
                Идэвхтэй (нэвтрэх хуудсанд харагдана)
              </span>
            </label>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Мэдэгдэл устгах"
        description={`"${deleteTarget?.title}"-г устгах уу?`}
      />
    </RoleGuard>
  );
}
