"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  X,
  Building2,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { formatDate, getInitials } from "@/lib/utils";
import {
  USER_ROLE_LABELS,
  type UserRole,
} from "@/lib/constants";
import { PageHeader } from "@/components/layout/PageHeader";
import { RoleGuard } from "@/components/shared/RoleGuard";
import {
  GlassPanel,
  Button,
  Input,
  Select,
  Badge,
  Table,
  Pagination,
  Modal,
  type Column,
} from "@/components/ui";
import type {
  UserResponse,
  CompanyGroupedUsers,
  CreateUserRequest,
} from "@/types/user";
import type { PagedResult } from "@/types/api";
import toast from "react-hot-toast";

const ROLE_OPTIONS = [
  { value: "", label: "Бүх роль" },
  { value: "SuperAdmin", label: "Супер админ" },
  { value: "Admin", label: "Админ" },
  { value: "User", label: "Хэрэглэгч" },
];

const ROLE_BADGE: Record<string, "info" | "warning" | "neutral"> = {
  SuperAdmin: "info",
  Admin: "warning",
  User: "neutral",
};

const CREATE_ROLE_OPTIONS = [
  { value: "User", label: "Хэрэглэгч" },
  { value: "Admin", label: "Админ" },
  { value: "SuperAdmin", label: "Супер админ" },
];

interface CompanyOption {
  id: string;
  name: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();

  // View toggle
  const [viewMode, setViewMode] = useState<"list" | "grouped">("list");

  // List view state
  const [data, setData] = useState<PagedResult<UserResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDesc, setSortDesc] = useState(true);

  // Grouped view state
  const [grouped, setGrouped] = useState<CompanyGroupedUsers[]>([]);
  const [groupedLoading, setGroupedLoading] = useState(false);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    fullName: "",
    companyId: "",
    position: "",
    phoneNumber: "",
    computerNumber: "",
    role: "User" as UserRole,
  });

  // Fetch list
  const fetchList = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number | boolean> = {
      page,
      pageSize: 20,
      sortBy,
      sortDescending: sortDesc,
    };
    if (search.trim()) params.search = search.trim();
    if (roleFilter) params.role = roleFilter;

    const res = await api.get<PagedResult<UserResponse>>("/users", params);
    if (res.success && res.data) setData(res.data);
    setLoading(false);
  }, [page, sortBy, sortDesc, search, roleFilter]);

  // Fetch grouped
  const fetchGrouped = useCallback(async () => {
    setGroupedLoading(true);
    const res = await api.get<CompanyGroupedUsers[]>("/users/grouped");
    if (res.success && res.data) setGrouped(res.data);
    setGroupedLoading(false);
  }, []);

  useEffect(() => {
    if (viewMode === "list") fetchList();
    else fetchGrouped();
  }, [viewMode, fetchList, fetchGrouped]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDesc(!sortDesc);
    else { setSortBy(key); setSortDesc(true); }
  };

  // Load companies for create modal
  const openCreateModal = async () => {
    setCreateOpen(true);
    if (companies.length === 0) {
      const res = await api.get<CompanyOption[]>("/companies");
      if (res.success && res.data) setCompanies(res.data);
    }
  };

  const handleCreate = async () => {
    setCreateLoading(true);
    const body: CreateUserRequest = {
      ...newUser,
      position: newUser.position || undefined,
      phoneNumber: newUser.phoneNumber || undefined,
      computerNumber: newUser.computerNumber || undefined,
    };
    const res = await api.post<UserResponse>("/users", body);
    if (res.success && res.data) {
      toast.success("Хэрэглэгч амжилттай үүсгэлээ");
      setCreateOpen(false);
      setNewUser({
        email: "", password: "", fullName: "", companyId: "",
        position: "", phoneNumber: "", computerNumber: "", role: "User",
      });
      if (viewMode === "list") fetchList();
      else fetchGrouped();
    } else {
      toast.error(res.errors?.[0] || "Алдаа гарлаа");
    }
    setCreateLoading(false);
  };

  const columns: Column<UserResponse>[] = [
    {
      key: "fullName",
      header: "Нэр",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-50 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {getInitials(row.fullName)}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{row.fullName}</p>
            <p className="text-xs text-gray-400">{row.position || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: "Имэйл",
      sortable: true,
      render: (row) => (
        <span className="text-gray-600">{row.email}</span>
      ),
    },
    {
      key: "companyName",
      header: "Компани",
      render: (row) => (
        <span className="text-gray-600">{row.companyName}</span>
      ),
    },
    {
      key: "role",
      header: "Роль",
      sortable: true,
      render: (row) => (
        <Badge variant={ROLE_BADGE[row.role] || "neutral"}>
          {USER_ROLE_LABELS[row.role]}
        </Badge>
      ),
    },
    {
      key: "isActive",
      header: "Төлөв",
      render: (row) => (
        <Badge variant={row.isActive ? "success" : "danger"} size="sm">
          {row.isActive ? "Идэвхтэй" : "Идэвхгүй"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Бүртгэсэн",
      render: (row) => (
        <span className="text-gray-500 text-xs">{formatDate(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <RoleGuard roles={["SuperAdmin", "Admin"]}>
      <PageHeader
        title="Хэрэглэгчид"
        description="Бүртгэлтэй хэрэглэгчдийн жагсаалт"
        actions={
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${viewMode === "list" ? "bg-primary text-white" : "text-gray-400 hover:text-gray-600"}`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grouped")}
                className={`p-2 transition-colors ${viewMode === "grouped" ? "bg-primary text-white" : "text-gray-400 hover:text-gray-600"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            {isSuperAdmin && (
              <Button
                icon={<Plus className="w-4 h-4" />}
                onClick={openCreateModal}
              >
                Хэрэглэгч нэмэх
              </Button>
            )}
          </div>
        }
      />

      {viewMode === "list" ? (
        <>
          {/* Filters */}
          <GlassPanel padding="sm" className="mb-4">
            <div className="flex flex-wrap items-end gap-3 p-1">
              <div className="flex-1 min-w-[200px] max-w-sm">
                <Input
                  placeholder="Хайх... (нэр, имэйл, компани)"
                  icon={<Search className="w-4 h-4" />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-44">
                <Select
                  options={ROLE_OPTIONS}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                />
              </div>
              {(search || roleFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X className="w-3 h-3" />}
                  onClick={() => { setSearch(""); setRoleFilter(""); }}
                >
                  Цэвэрлэх
                </Button>
              )}
            </div>
          </GlassPanel>

          <GlassPanel padding="none">
            <Table
              columns={columns}
              data={data?.items ?? []}
              loading={loading}
              sortBy={sortBy}
              sortDesc={sortDesc}
              onSort={handleSort}
              rowKey={(row) => row.id}
              onRowClick={(row) => router.push(`/users/${row.id}`)}
              emptyMessage="Хэрэглэгч олдсонгүй"
            />
          </GlassPanel>

          {data && data.totalPages > 1 && (
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              totalCount={data.totalCount}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        /* Grouped by company view */
        <div className="space-y-6">
          {groupedLoading ? (
            <GlassPanel>
              <div className="text-center py-10 text-gray-400 text-sm">
                Ачаалж байна...
              </div>
            </GlassPanel>
          ) : grouped.length === 0 ? (
            <GlassPanel>
              <div className="text-center py-10 text-gray-400 text-sm">
                Компани олдсонгүй
              </div>
            </GlassPanel>
          ) : (
            grouped.map((group) => (
              <GlassPanel key={group.companyId}>
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    {group.companyName}
                  </h3>
                  <Badge variant="neutral" size="sm">
                    {group.users.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.users.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => router.push(`/users/${u.id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/50 cursor-pointer transition-colors border border-transparent hover:border-gray-100"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-50 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                        {getInitials(u.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {u.fullName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {u.position || u.email}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={ROLE_BADGE[u.role] || "neutral"}
                          size="sm"
                        >
                          {USER_ROLE_LABELS[u.role]}
                        </Badge>
                        {!u.isActive && (
                          <Badge variant="danger" size="sm">
                            Идэвхгүй
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            ))
          )}
        </div>
      )}

      {/* Create user modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Хэрэглэгч нэмэх"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Болих
            </Button>
            <Button loading={createLoading} onClick={handleCreate}>
              Үүсгэх
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Имэйл"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
            <Input
              label="Нууц үг"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
          </div>
          <Input
            label="Овог нэр"
            value={newUser.fullName}
            onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {companies.length > 0 && (
              <Select
                label="Компани"
                options={companies.map((c) => ({ value: c.id, label: c.name }))}
                value={newUser.companyId}
                onChange={(e) => setNewUser({ ...newUser, companyId: e.target.value })}
                placeholder="Компани сонгох"
                required
              />
            )}
            <Select
              label="Роль"
              options={CREATE_ROLE_OPTIONS}
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Албан тушаал"
              value={newUser.position}
              onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
            />
            <Input
              label="Утас"
              value={newUser.phoneNumber}
              onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
            />
            <Input
              label="Компьютер №"
              value={newUser.computerNumber}
              onChange={(e) => setNewUser({ ...newUser, computerNumber: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </RoleGuard>
  );
}
