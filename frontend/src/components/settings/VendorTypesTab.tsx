"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  GlassPanel,
  Button,
  Input,
  Textarea,
  Modal,
  ConfirmDialog,
  Badge,
  Spinner,
  Table,
  type Column,
} from "@/components/ui";
import type {
  VendorType,
  CreateVendorTypeRequest,
  UpdateVendorTypeRequest,
} from "@/types/vendor";
import toast from "react-hot-toast";

export function VendorTypesTab() {
  const { isSuperAdmin } = useAuth();

  const [types, setTypes] = useState<VendorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VendorType | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VendorType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    sortOrder: 0,
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get<VendorType[]>("/vendor-contacts/types");
    if (res.success && res.data) setTypes(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      sortOrder: types.length,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEdit = (t: VendorType) => {
    setEditing(t);
    setForm({
      name: t.name,
      description: t.description ?? "",
      sortOrder: t.sortOrder,
      isActive: t.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Нэр оруулна уу");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const body: UpdateVendorTypeRequest = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          sortOrder: form.sortOrder,
          isActive: form.isActive,
        };
        const res = await api.put(`/vendor-contacts/types/${editing.id}`, body);
        if (res.success) {
          toast.success("Шинэчлэгдлээ");
          setModalOpen(false);
          load();
        } else {
          toast.error(res.errors?.[0] || "Алдаа гарлаа");
        }
      } else {
        const body: CreateVendorTypeRequest = {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          sortOrder: form.sortOrder,
        };
        const res = await api.post("/vendor-contacts/types", body);
        if (res.success) {
          toast.success("Төрөл нэмэгдлээ");
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
    const res = await api.delete(`/vendor-contacts/types/${deleteTarget.id}`);
    if (res.success) {
      toast.success("Устгагдлаа");
      setDeleteTarget(null);
      load();
    } else {
      toast.error(res.errors?.[0] || "Устгах боломжгүй");
    }
    setDeleting(false);
  };

  const columns: Column<VendorType>[] = [
    {
      key: "sortOrder",
      header: "#",
      width: "w-12",
      render: (t) => (
        <span className="text-xs text-gray-400 font-mono">{t.sortOrder}</span>
      ),
    },
    {
      key: "name",
      header: "Нэр",
      render: (t) => (
        <div>
          <p className="font-medium text-gray-900 text-sm">{t.name}</p>
          {t.description && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
              {t.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "vendorCount",
      header: "Харилцагч",
      align: "right" as const,
      render: (t) => (
        <span className="text-sm font-medium text-gray-700">
          {t.vendorCount}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Төлөв",
      render: (t) => (
        <Badge
          variant="custom"
          size="sm"
          className={
            t.isActive
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-gray-50 text-gray-500 border-gray-200"
          }
        >
          {t.isActive ? "Идэвхтэй" : "Идэвхгүй"}
        </Badge>
      ),
    },
    {
      key: "id",
      header: "",
      align: "right" as const,
      render: (t) => (
        <div className="flex items-center justify-end gap-1">
          {isSuperAdmin && (
            <>
              <button
                onClick={() => openEdit(t)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                title="Засах"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(t)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Устгах"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Нийт {types.length} төрөл</p>
        {isSuperAdmin && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            Төрөл нэмэх
          </Button>
        )}
      </div>

      <GlassPanel padding="none">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <Table
            columns={columns}
            data={types}
            rowKey={(t) => t.id}
            emptyMessage="Төрөл байхгүй байна"
          />
        )}
      </GlassPanel>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Төрөл засах" : "Төрөл нэмэх"}
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
          <Input
            label="Нэр *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Жишээ: Компьютер засвар"
          />
          <Textarea
            label="Тайлбар"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Товч тайлбар"
            rows={2}
          />
          <Input
            label="Дараалал"
            type="number"
            value={form.sortOrder.toString()}
            onChange={(e) =>
              setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
            }
          />
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
              <span className="text-sm text-gray-700">Идэвхтэй</span>
            </label>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Төрөл устгах"
        description={`"${deleteTarget?.name}"-г устгах уу? Бүртгэгдсэн харилцагчтай төрлийг устгах боломжгүй.`}
      />
    </>
  );
}
