"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  GlassPanel,
  Button,
  Input,
  Badge,
} from "@/components/ui";
import type { AuthUser } from "@/types/auth";
import type { UpdateProfileRequest, ChangePasswordRequest } from "@/types/user";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  // Edit profile
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName ?? "",
    position: user?.position ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    computerNumber: user?.computerNumber ?? "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleProfileSave = async () => {
    setProfileLoading(true);
    const body: UpdateProfileRequest = {
      fullName: profileForm.fullName,
      position: profileForm.position || undefined,
      phoneNumber: profileForm.phoneNumber || undefined,
      computerNumber: profileForm.computerNumber || undefined,
    };
    const res = await api.put<AuthUser>("/profile", body);
    if (res.success) {
      toast.success("Профайл шинэчлэгдлээ");
      await refreshUser();
      setEditing(false);
    } else {
      toast.error(res.errors?.[0] || "Алдаа гарлаа");
    }
    setProfileLoading(false);
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Шинэ нууц үг тохирохгүй байна");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
      return;
    }

    setPasswordLoading(true);
    const body: ChangePasswordRequest = {
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    };
    const res = await api.put("/profile/password", body);
    if (res.success) {
      toast.success("Нууц үг амжилттай солигдлоо");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      toast.error(res.errors?.[0] || "Алдаа гарлаа");
    }
    setPasswordLoading(false);
  };

  if (!user) return null;

  return (
    <>
      <PageHeader
        title="Профайл"
        description="Хувийн мэдээлэл удирдах"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: profile card */}
        <GlassPanel>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary-50 text-primary flex items-center justify-center text-2xl font-bold mb-3">
              {getInitials(user.fullName)}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {user.fullName}
            </h3>
            <p className="text-sm text-gray-500">{user.position || "—"}</p>
            <Badge variant="info" className="mt-2">
              {USER_ROLE_LABELS[user.role]}
            </Badge>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 space-y-3 text-sm">
            <ProfileRow label="Имэйл" value={user.email} />
            <ProfileRow label="Компани" value={user.companyName} />
            <ProfileRow label="Утас" value={user.phoneNumber} />
            <ProfileRow label="Компьютер №" value={user.computerNumber} />
          </div>

          {!editing && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full mt-4"
              onClick={() => {
                setProfileForm({
                  fullName: user.fullName,
                  position: user.position ?? "",
                  phoneNumber: user.phoneNumber ?? "",
                  computerNumber: user.computerNumber ?? "",
                });
                setEditing(true);
              }}
            >
              Мэдээлэл засах
            </Button>
          )}
        </GlassPanel>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit profile form */}
          {editing && (
            <GlassPanel>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Мэдээлэл засах
              </h3>
              <div className="space-y-4">
                <Input
                  label="Овог нэр"
                  value={profileForm.fullName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, fullName: e.target.value })
                  }
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Албан тушаал"
                    value={profileForm.position}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        position: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Утасны дугаар"
                    value={profileForm.phoneNumber}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        phoneNumber: e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Компьютер №"
                    value={profileForm.computerNumber}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        computerNumber: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                <Button loading={profileLoading} onClick={handleProfileSave}>
                  Хадгалах
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Болих
                </Button>
              </div>
            </GlassPanel>
          )}

          {/* Password change */}
          <GlassPanel>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Нууц үг солих
            </h3>
            <div className="space-y-4">
              <Input
                label="Одоогийн нууц үг"
                type="password"
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Шинэ нууц үг"
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  required
                />
                <Input
                  label="Шинэ нууц үг давтах"
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  error={
                    passwordForm.confirmPassword &&
                    passwordForm.newPassword !== passwordForm.confirmPassword
                      ? "Нууц үг тохирохгүй байна"
                      : undefined
                  }
                  required
                />
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <Button
                loading={passwordLoading}
                onClick={handlePasswordChange}
                disabled={
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  !passwordForm.confirmPassword
                }
              >
                Нууц үг солих
              </Button>
            </div>
          </GlassPanel>
        </div>
      </div>
    </>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value || "—"}</span>
    </div>
  );
}
