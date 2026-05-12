"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Monitor,
  Calendar,
  Save,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { formatDateTime, getInitials } from "@/lib/utils";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/constants";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleGuard } from "@/components/shared/RoleGuard";
import {
  GlassPanel,
  Button,
  Input,
  Select,
  Badge,
  Spinner,
  ConfirmDialog,
  Modal,
} from "@/components/ui";
import type { UserResponse, UpdateUserRequest } from "@/types/user";
import toast from "react-hot-toast";

const ROLE_OPTIONS = [
  { value: "User", label: "Хэрэглэгч" },
  { value: "Admin", label: "Админ" },
  { value: "SuperAdmin", label: "Супер админ" },
];

interface CompanyOption {
  id: string;
  name: string;
}

interface DepartmentOption {
  id: string;
  name: string;
  companyId: string;
}

export default function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { isSuperAdmin, isAdmin } = useAuth();

  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    companyId: "",
    departmentId: "",
    position: "",
    phoneNumber: "",
    computerNumber: "",
    role: "User" as UserRole,
    isActive: true,
    isGlobalApprover: false,
    showOnLoginPage: false,
  });
  const [saveLoading, setSaveLoading] = useState(false);

  // Deactivate confirm
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Hard delete confirm
  const [hardDeleteOpen, setHardDeleteOpen] = useState(false);
  const [hardDeleteLoading, setHardDeleteLoading] = useState(false);

  // Reset password modal
  const [pwOpen, setPwOpen] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");

  const fetchUser = useCallback(async () => {
    const res = await api.get<UserResponse>(`/users/${params.id}`);
    if (res.success && res.data) {
      setUser(res.data);
      setForm({
        fullName: res.data.fullName,
        companyId: res.data.companyId,
        departmentId: res.data.departmentId ?? "",
        position: res.data.position ?? "",
        phoneNumber: res.data.phoneNumber ?? "",
        computerNumber: res.data.computerNumber ?? "",
        role: res.data.role,
        isActive: res.data.isActive,
        isGlobalApprover: res.data.isGlobalApprover ?? false,
        showOnLoginPage: res.data.showOnLoginPage ?? false,
      });
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (editing && companies.length === 0) {
      api.get<CompanyOption[]>("/companies").then((res) => {
        if (res.success && res.data) setCompanies(res.data);
      });
    }
  }, [editing, companies.length]);

  // Load departments for the selected company
  useEffect(() => {
    if (!editing || !form.companyId) {
      setDepartments([]);
      return;
    }
    api
      .get<DepartmentOption[]>("/departments", { companyId: form.companyId })
      .then((res) => {
        if (res.success && res.data) setDepartments(res.data);
        else setDepartments([]);
      });
  }, [editing, form.companyId]);

  const handleSave = async () => {
    setSaveLoading(true);
    const body: UpdateUserRequest = {
      fullName: form.fullName,
      companyId: form.companyId,
      departmentId: form.departmentId || undefined,
      position: form.position || undefined,
      phoneNumber: form.phoneNumber || undefined,
      computerNumber: form.computerNumber || undefined,
      role: form.role,
      isActive: form.isActive,
      isGlobalApprover: form.role === "Admin" ? form.isGlobalApprover : false,
      showOnLoginPage:
        form.role === "Admin" || form.role === "SuperAdmin"
          ? form.showOnLoginPage
          : false,
    };
    const res = await api.put<UserResponse>(`/users/${params.id}`, body);
    if (res.success && res.data) {
      setUser(res.data);
      setEditing(false);
      toast.success("Хэрэглэгч шинэчлэгдлээ");
    } else {
      toast.error(res.errors?.[0] || "Алдаа гарлаа");
    }
    setSaveLoading(false);
  };

  const handleResetPassword = async () => {
    if (pwNew.length < 6) {
      toast.error("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
      return;
    }
    if (pwNew !== pwConfirm) {
      toast.error("Нууц үг тохирохгүй байна");
      return;
    }
    setPwLoading(true);
    const res = await api.post(`/users/${params.id}/reset-password`, {
      newPassword: pwNew,
    });
    if (res.success) {
      toast.success("Нууц үг амжилттай шинэчлэгдлээ");
      setPwOpen(false);
      setPwNew("");
      setPwConfirm("");
    } else {
      toast.error(res.errors?.[0] || "Алдаа гарлаа");
    }
    setPwLoading(false);
  };

  const handleDeactivate = async () => {
    setDeactivateLoading(true);
    const res = await api.delete(`/users/${params.id}`);
    if (res.success) {
      toast.success("Хэрэглэгч идэвхгүй болгогдлоо");
      router.push("/users");
    } else {
      toast.error(res.errors?.[0] || "Алдаа гарлаа");
    }
    setDeactivateLoading(false);
    setDeactivateOpen(false);
  };

  const handleHardDelete = async () => {
    setHardDeleteLoading(true);
    const res = await api.delete(`/users/${params.id}/permanent`);
    if (res.success) {
      toast.success("Хэрэглэгч бүрмөсөн устгагдлаа");
      router.push("/users");
    } else {
      toast.error(res.errors?.[0] || "Алдаа гарлаа");
    }
    setHardDeleteLoading(false);
    setHardDeleteOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-gray-500">
        Хэрэглэгч олдсонгүй
      </div>
    );
  }

  return (
    <RoleGuard roles={["SuperAdmin", "Admin"]}>
      <PageHeader
        title="Хэрэглэгчийн мэдээлэл"
        description={user.email}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => router.push("/users")}
            >
              Буцах
            </Button>
            {isSuperAdmin && !editing && (
              <Button size="sm" onClick={() => setEditing(true)}>
                Засах
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <GlassPanel>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary-50 text-primary flex items-center justify-center text-2xl font-bold mb-3">
              {getInitials(user.fullName)}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {user.fullName}
            </h3>
            <p className="text-sm text-gray-500">{user.position || "—"}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={
                  user.role === "SuperAdmin"
                    ? "info"
                    : user.role === "Admin"
                    ? "warning"
                    : "neutral"
                }
              >
                {USER_ROLE_LABELS[user.role]}
              </Badge>
              <Badge variant={user.isActive ? "success" : "danger"} size="sm">
                {user.isActive ? "Идэвхтэй" : "Идэвхгүй"}
              </Badge>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
            <InfoRow icon={Mail} value={user.email} />
            <InfoRow icon={Building2} value={user.companyName} />
            <InfoRow icon={Phone} value={user.phoneNumber} />
            <InfoRow icon={Monitor} value={user.computerNumber} />
            <InfoRow
              icon={Calendar}
              value={formatDateTime(user.createdAt)}
            />
          </div>

          {/* Password reset: SuperAdmin can reset anyone; Admin can reset non-SuperAdmin only */}
          {!editing && (isSuperAdmin || (isAdmin && user.role !== "SuperAdmin")) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                icon={<KeyRound className="w-4 h-4" />}
                onClick={() => setPwOpen(true)}
              >
                Нууц үг солих
              </Button>
            </div>
          )}

          {isSuperAdmin && !editing && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
              {user.isActive && (
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full"
                  onClick={() => setDeactivateOpen(true)}
                >
                  Идэвхгүй болгох
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                className="w-full"
                onClick={() => setHardDeleteOpen(true)}
              >
                Бүрмөсөн устгах
              </Button>
            </div>
          )}
        </GlassPanel>

        {/* Edit form / Info */}
        <GlassPanel className="lg:col-span-2">
          {editing ? (
            <>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Мэдээлэл засах
              </h3>
              <div className="space-y-4">
                <Input
                  label="Овог нэр"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {companies.length > 0 && (
                    <Select
                      label="Компани"
                      options={companies.map((c) => ({
                        value: c.id,
                        label: c.name,
                      }))}
                      value={form.companyId}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          companyId: e.target.value,
                          departmentId: "",
                        })
                      }
                    />
                  )}
                  <Select
                    label="Роль"
                    options={ROLE_OPTIONS}
                    value={form.role}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        role: e.target.value as UserRole,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Хэлтэс"
                    options={[
                      { value: "", label: "Сонгоогүй" },
                      ...departments.map((d) => ({
                        value: d.id,
                        label: d.name,
                      })),
                    ]}
                    value={form.departmentId}
                    onChange={(e) =>
                      setForm({ ...form, departmentId: e.target.value })
                    }
                  />
                  <Input
                    label="Албан тушаал"
                    value={form.position}
                    onChange={(e) =>
                      setForm({ ...form, position: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Утас"
                    value={form.phoneNumber}
                    onChange={(e) =>
                      setForm({ ...form, phoneNumber: e.target.value })
                    }
                  />
                  <Input
                    label="Компьютер №"
                    value={form.computerNumber}
                    onChange={(e) =>
                      setForm({ ...form, computerNumber: e.target.value })
                    }
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Идэвхтэй</span>
                </label>

                {form.role === "Admin" && (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isGlobalApprover}
                      onChange={(e) =>
                        setForm({ ...form, isGlobalApprover: e.target.checked })
                      }
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm text-gray-700">
                        Бүх компанийн шилжүүлгийн урсгалд оролцох эрх
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Энэ хэрэглэгчийг бусад компанийн workflow дотор
                        approver-аар тохируулах боломжтой болгоно.
                      </p>
                    </div>
                  </label>
                )}

                {(form.role === "Admin" || form.role === "SuperAdmin") && (
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.showOnLoginPage}
                      onChange={(e) =>
                        setForm({ ...form, showOnLoginPage: e.target.checked })
                      }
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm text-gray-700">
                        Login хуудсанд утасны дуудлага хийдэг ажилтнаар харуулах
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Нэвтрэх хуудаснаас гадны хэрэглэгч энэ хүн рүү шууд
                        утасдах боломжтой болно.
                      </p>
                    </div>
                  </label>
                )}
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                <Button
                  icon={<Save className="w-4 h-4" />}
                  loading={saveLoading}
                  onClick={handleSave}
                >
                  Хадгалах
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    if (user) {
                      setForm({
                        fullName: user.fullName,
                        companyId: user.companyId,
                        departmentId: user.departmentId ?? "",
                        position: user.position ?? "",
                        phoneNumber: user.phoneNumber ?? "",
                        computerNumber: user.computerNumber ?? "",
                        role: user.role,
                        isActive: user.isActive,
                        isGlobalApprover: user.isGlobalApprover ?? false,
                        showOnLoginPage: user.showOnLoginPage ?? false,
                      });
                    }
                  }}
                >
                  Болих
                </Button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Дэлгэрэнгүй мэдээлэл
              </h3>
              <div className="space-y-3">
                <DetailRow label="Овог нэр" value={user.fullName} />
                <DetailRow label="Имэйл" value={user.email} />
                <DetailRow label="Компани" value={user.companyName} />
                <DetailRow label="Хэлтэс" value={user.departmentName} />
                <DetailRow
                  label="Роль"
                  value={USER_ROLE_LABELS[user.role]}
                />
                {user.role === "Admin" && (
                  <DetailRow
                    label="Бүх компанийн урсгал"
                    value={user.isGlobalApprover ? "Эрх олгосон" : "Эрх олгоогүй"}
                  />
                )}
                <DetailRow label="Албан тушаал" value={user.position} />
                <DetailRow label="Утас" value={user.phoneNumber} />
                <DetailRow
                  label="Компьютер №"
                  value={user.computerNumber}
                />
                <DetailRow
                  label="Бүртгэсэн огноо"
                  value={formatDateTime(user.createdAt)}
                />
              </div>
            </>
          )}
        </GlassPanel>
      </div>

      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={handleDeactivate}
        title="Хэрэглэгч идэвхгүй болгох"
        description={`"${user.fullName}" хэрэглэгчийг идэвхгүй болгох уу? Энэ хэрэглэгч системд нэвтрэх боломжгүй болно.`}
        confirmLabel="Идэвхгүй болгох"
        loading={deactivateLoading}
      />

      <ConfirmDialog
        open={hardDeleteOpen}
        onClose={() => setHardDeleteOpen(false)}
        onConfirm={handleHardDelete}
        title="Хэрэглэгч бүрмөсөн устгах"
        description={`"${user.fullName}" хэрэглэгчийг бүрмөсөн устгах уу? Энэ үйлдлийг буцаах боломжгүй!`}
        confirmLabel="Бүрмөсөн устгах"
        loading={hardDeleteLoading}
      />

      <Modal
        open={pwOpen}
        onClose={() => {
          setPwOpen(false);
          setPwNew("");
          setPwConfirm("");
        }}
        title="Нууц үг солих"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setPwOpen(false);
                setPwNew("");
                setPwConfirm("");
              }}
              disabled={pwLoading}
            >
              Болих
            </Button>
            <Button
              onClick={handleResetPassword}
              loading={pwLoading}
              disabled={!pwNew || !pwConfirm}
            >
              Хадгалах
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{user.fullName}</span>{" "}
            хэрэглэгчийн нууц үгийг шинээр тогтоох. Хадгалсан даруйд тухайн
            хэрэглэгчийн идэвхтэй session-ууд цуцлагдана.
          </p>
          <Input
            label="Шинэ нууц үг"
            type="password"
            placeholder="••••••••"
            value={pwNew}
            onChange={(e) => setPwNew(e.target.value)}
            helperText="Хамгийн багадаа 6 тэмдэгт"
            required
          />
          <Input
            label="Нууц үг давтах"
            type="password"
            placeholder="••••••••"
            value={pwConfirm}
            onChange={(e) => setPwConfirm(e.target.value)}
            error={
              pwConfirm && pwNew !== pwConfirm
                ? "Нууц үг тохирохгүй байна"
                : undefined
            }
            required
          />
        </div>
      </Modal>
    </RoleGuard>
  );
}

function InfoRow({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value?: string | null;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <span className="text-gray-700">{value || "—"}</span>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex justify-between py-2.5 border-b border-gray-50 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value || "—"}</span>
    </div>
  );
}
