"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Phone,
  Mail,
  User,
  Building2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleGuard } from "@/components/shared/RoleGuard";
import {
  GlassPanel,
  Button,
  Input,
  Select,
  Modal,
  Textarea,
  Badge,
  Spinner,
  ConfirmDialog,
  EmptyState,
} from "@/components/ui";
import type {
  VendorType,
  VendorContact,
  CreateVendorContactRequest,
  UpdateVendorContactRequest,
} from "@/types/vendor";
import toast from "react-hot-toast";

export default function VendorsPage() {
  const { isSuperAdmin, isAdminOrAbove } = useAuth();

  const [types, setTypes] = useState<VendorType[]>([]);
  const [vendors, setVendors] = useState<VendorContact[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VendorContact | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vendorTypeId: "",
    companyName: "",
    accountManager: "",
    phone: "",
    email: "",
    description: "",
    isActive: true,
    showOnLoginPage: false,
  });

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<VendorContact | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTypes = useCallback(async () => {
    const res = await api.get<VendorType[]>("/vendor-contacts/types");
    if (res.success && res.data) setTypes(res.data.filter((t) => t.isActive));
  }, []);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (typeFilter) params.typeId = typeFilter;
    if (search.trim()) params.search = search.trim();
    const res = await api.get<VendorContact[]>("/vendor-contacts", params);
    if (res.success && res.data) setVendors(res.data);
    setLoading(false);
  }, [search, typeFilter]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      vendorTypeId: types[0]?.id ?? "",
      companyName: "",
      accountManager: "",
      phone: "",
      email: "",
      description: "",
      isActive: true,
      showOnLoginPage: false,
    });
    setModalOpen(true);
  };

  const openEdit = (v: VendorContact) => {
    setEditing(v);
    setForm({
      vendorTypeId: v.vendorTypeId,
      companyName: v.companyName,
      accountManager: v.accountManager ?? "",
      phone: v.phone ?? "",
      email: v.email ?? "",
      description: v.description ?? "",
      isActive: v.isActive,
      showOnLoginPage: v.showOnLoginPage ?? false,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.vendorTypeId) {
      toast.error("Төрөл сонгоно уу");
      return;
    }
    if (!form.companyName.trim()) {
      toast.error("Компанийн нэр оруулна уу");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const body: UpdateVendorContactRequest = {
          vendorTypeId: form.vendorTypeId,
          companyName: form.companyName.trim(),
          accountManager: form.accountManager.trim() || undefined,
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          description: form.description.trim() || undefined,
          isActive: form.isActive,
          showOnLoginPage: form.showOnLoginPage,
        };
        const res = await api.put(`/vendor-contacts/${editing.id}`, body);
        if (res.success) {
          toast.success("Шинэчлэгдлээ");
          setModalOpen(false);
          loadVendors();
        } else {
          toast.error(res.errors?.[0] || "Алдаа гарлаа");
        }
      } else {
        const body: CreateVendorContactRequest = {
          vendorTypeId: form.vendorTypeId,
          companyName: form.companyName.trim(),
          accountManager: form.accountManager.trim() || undefined,
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          description: form.description.trim() || undefined,
          showOnLoginPage: isSuperAdmin ? form.showOnLoginPage : false,
        };
        const res = await api.post("/vendor-contacts", body);
        if (res.success) {
          toast.success("Харилцагч бүртгэгдлээ");
          setModalOpen(false);
          loadVendors();
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
    const res = await api.delete(`/vendor-contacts/${deleteTarget.id}`);
    if (res.success) {
      toast.success("Устгагдлаа");
      setDeleteTarget(null);
      loadVendors();
    } else {
      toast.error(res.errors?.[0] || "Алдаа гарлаа");
    }
    setDeleting(false);
  };

  // Group vendors by type for cleaner display
  const grouped = vendors.reduce<Record<string, VendorContact[]>>((acc, v) => {
    const key = v.vendorTypeName || "—";
    (acc[key] ??= []).push(v);
    return acc;
  }, {});

  return (
    <RoleGuard roles={["SuperAdmin", "Admin"]}>
      <PageHeader
        title="Харилцагч лавлах"
        description="МТ-ийн харилцагч компани, нийлүүлэгчийн утасны лавлах"
        actions={
          isAdminOrAbove && (
            <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              Харилцагч нэмэх
            </Button>
          )
        }
      />

      <GlassPanel padding="sm" className="mb-4">
        <div className="flex flex-wrap items-end gap-3 p-1">
          <div className="flex-1 min-w-[220px] max-w-sm">
            <Input
              placeholder="Хайх... (нэр, утас, и-мэйл, менежер)"
              icon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-56">
            <Select
              options={[
                { value: "", label: "Бүх төрөл" },
                ...types.map((t) => ({ value: t.id, label: t.name })),
              ]}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
          {(search || typeFilter) && (
            <Button
              variant="ghost"
              size="sm"
              icon={<X className="w-3 h-3" />}
              onClick={() => {
                setSearch("");
                setTypeFilter("");
              }}
            >
              Цэвэрлэх
            </Button>
          )}
        </div>
        <div className="mt-2 px-1 text-xs text-gray-500">
          {search || typeFilter ? "Илэрц: " : "Нийт: "}
          <span className="font-medium text-gray-700">{vendors.length}</span>{" "}
          харилцагч
        </div>
      </GlassPanel>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : vendors.length === 0 ? (
        <EmptyState message="Харилцагч бүртгэгдээгүй байна — шинээр нэмж эхлээрэй" />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([typeName, list]) => (
            <div key={typeName}>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {typeName}
                </h3>
                <Badge variant="neutral" size="sm">
                  {list.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {list.map((v) => (
                  <GlassPanel key={v.id} padding="md">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary shrink-0" />
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {v.companyName}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {!v.isActive && (
                            <Badge variant="neutral" size="sm">
                              Идэвхгүй
                            </Badge>
                          )}
                          {v.showOnLoginPage && (
                            <Badge
                              variant="custom"
                              size="sm"
                              className="bg-amber-50 text-amber-700 border-amber-200"
                            >
                              Login дээр
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => openEdit(v)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                              title="Засах"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(v)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              title="Устгах"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {v.accountManager && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {v.accountManager}
                        </div>
                      )}
                      {v.phone && (
                        <a
                          href={`tel:${v.phone}`}
                          className="flex items-center gap-2 text-gray-700 hover:text-primary"
                        >
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {v.phone}
                        </a>
                      )}
                      {v.email && (
                        <a
                          href={`mailto:${v.email}`}
                          className="flex items-center gap-2 text-gray-700 hover:text-primary truncate"
                        >
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{v.email}</span>
                        </a>
                      )}
                      {v.description && (
                        <p className="text-gray-500 mt-2 pt-2 border-t border-gray-100 line-clamp-2">
                          {v.description}
                        </p>
                      )}
                    </div>
                  </GlassPanel>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Харилцагч засах" : "Харилцагч нэмэх"}
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
          <Select
            label="Төрөл *"
            options={types.map((t) => ({ value: t.id, label: t.name }))}
            value={form.vendorTypeId}
            onChange={(e) => setForm({ ...form, vendorTypeId: e.target.value })}
            placeholder="Сонгох..."
          />
          <Input
            label="Компанийн нэр *"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            placeholder="Жишээ: XYZ Системс ХХК"
          />
          <Input
            label="Харилцагч менежер (инженер)"
            value={form.accountManager}
            onChange={(e) =>
              setForm({ ...form, accountManager: e.target.value })
            }
            placeholder="Овог нэр"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Утас"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+976 xxxxxxxx"
            />
            <Input
              label="И-мэйл"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="info@vendor.mn"
            />
          </div>
          <Textarea
            label="Тайлбар"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Гэрээний хугацаа, үйлчилгээний цар хүрээ гэх мэт"
            rows={3}
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

          {isSuperAdmin && (
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.showOnLoginPage}
                onChange={(e) =>
                  setForm({ ...form, showOnLoginPage: e.target.checked })
                }
                className="w-4 h-4 mt-0.5 rounded"
              />
              <div>
                <span className="text-sm text-gray-700">
                  Login хуудсанд харуулах
                </span>
                <p className="text-xs text-gray-400 mt-0.5">
                  Нэвтрэх хуудаснаас энэ харилцагчийн утас, мэдээллийг
                  гадны хэрэглэгчид харах боломжтой болно.
                </p>
              </div>
            </label>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Харилцагч устгах"
        description={`"${deleteTarget?.companyName}"-г устгах уу?`}
      />
    </RoleGuard>
  );
}
