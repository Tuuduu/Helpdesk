"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime } from "@/lib/utils";
import {
  GlassPanel,
  Button,
  Input,
  Select,
  Modal,
  ConfirmDialog,
  Spinner,
  Badge,
  Table,
  type Column,
} from "@/components/ui";
import type {
  DepartmentResponse,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from "@/types/department";

interface CompanyOption {
  id: string;
  name: string;
}

export function DepartmentsTab() {
  const { isSuperAdmin } = useAuth();

  const [items, setItems] = useState<DepartmentResponse[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterCompanyId, setFilterCompanyId] = useState("");

  const [editing, setEditing] = useState<DepartmentResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] =
    useState<DepartmentResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (filterCompanyId) params.companyId = filterCompanyId;
    const res = await api.get<DepartmentResponse[]>("/departments", params);
    if (res.success && res.data) setItems(res.data);
    setLoading(false);
  }, [filterCompanyId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    api.get<CompanyOption[]>("/companies").then((res) => {
      if (res.success && res.data) setCompanies(res.data);
    });
  }, []);

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setName("");
    setCompanyId(companies[0]?.id ?? "");
  };

  const openEdit = (d: DepartmentResponse) => {
    setEditing(d);
    setCreating(false);
    setName(d.name);
    setCompanyId(d.companyId);
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
    setName("");
    setCompanyId("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Нэр оруулна уу");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const body: UpdateDepartmentRequest = { name: name.trim() };
        const res = await api.put<DepartmentResponse>(
          `/departments/${editing.id}`,
          body
        );
        if (res.success) {
          toast.success("Шинэчиллээ");
          closeModal();
          fetchItems();
        } else {
          toast.error(res.errors?.[0] || "Алдаа");
        }
      } else {
        if (!companyId) {
          toast.error("Компани сонгоно уу");
          setSaving(false);
          return;
        }
        const body: CreateDepartmentRequest = {
          name: name.trim(),
          companyId,
        };
        const res = await api.post<DepartmentResponse>("/departments", body);
        if (res.success) {
          toast.success("Үүслээ");
          closeModal();
          fetchItems();
        } else {
          toast.error(res.errors?.[0] || "Алдаа");
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await api.delete(`/departments/${deleteTarget.id}`);
    if (res.success) {
      toast.success("Устгалаа");
      setDeleteTarget(null);
      fetchItems();
    } else {
      toast.error(res.errors?.[0] || "Алдаа");
    }
    setDeleting(false);
  };

  const columns: Column<DepartmentResponse>[] = [
    {
      key: "name",
      header: "Нэр",
      render: (d) => (
        <span className="font-medium text-gray-900">{d.name}</span>
      ),
    },
    {
      key: "companyName",
      header: "Компани",
      render: (d) => <span className="text-gray-600">{d.companyName}</span>,
    },
    {
      key: "userCount",
      header: "Ажилтан",
      render: (d) => (
        <Badge variant="info" size="sm">
          {d.userCount}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Үүсгэсэн",
      render: (d) => (
        <span className="text-gray-500 text-xs">
          {formatDateTime(d.createdAt)}
        </span>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            key: "actions",
            header: "",
            width: "w-32",
            render: (d: DepartmentResponse) => (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Pencil className="w-3.5 h-3.5" />}
                  onClick={(e) => {
                    e?.stopPropagation();
                    openEdit(d);
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={(e) => {
                    e?.stopPropagation();
                    setDeleteTarget(d);
                  }}
                />
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-56">
            <Select
              options={[
                { value: "", label: "Бүх компани" },
                ...companies.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={filterCompanyId}
              onChange={(e) => setFilterCompanyId(e.target.value)}
            />
          </div>
        </div>
        {isSuperAdmin && (
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={openCreate}
          >
            Хэлтэс нэмэх
          </Button>
        )}
      </div>

      {!isSuperAdmin && (
        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          Зөвхөн SuperAdmin хэлтэс нэмэх / засах / устгах эрхтэй.
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <GlassPanel padding="none">
          <Table
            columns={columns}
            data={items}
            rowKey={(d) => d.id}
            emptyMessage="Хэлтэс олдсонгүй"
          />
        </GlassPanel>
      )}

      <Modal
        open={creating || editing !== null}
        onClose={closeModal}
        title={editing ? "Хэлтэс засах" : "Шинэ хэлтэс"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={saving}>
              Цуцлах
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? "Хадгалах" : "Үүсгэх"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Нэр"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Жишээ: НББ-ийн хэлтэс"
            required
          />
          {!editing && (
            <Select
              label="Компани"
              options={[
                { value: "", label: "Сонгох..." },
                ...companies.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              required
            />
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Хэлтэс устгах уу?"
        description={
          deleteTarget
            ? `'${deleteTarget.name}' хэлтсийг устгана. ${deleteTarget.userCount} ажилтны хэлтсийн холбоос арилна.`
            : ""
        }
        confirmLabel="Устгах"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}
