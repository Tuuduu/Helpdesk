"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Phone, Monitor, Briefcase } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { registerUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { GlassPanel, Button, Input, Select } from "@/components/ui";
import { Logo } from "@/components/layout/Logo";
import Link from "next/link";
import toast from "react-hot-toast";

interface CompanyOption {
  id: string;
  name: string;
}

interface DepartmentOption {
  id: string;
  name: string;
  companyId: string;
}

export default function RegisterPage() {
  const { isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyId: "",
    departmentId: "",
    position: "",
    phoneNumber: "",
    computerNumber: "",
  });

  useEffect(() => {
    api.get<CompanyOption[]>("/companies").then((res) => {
      if (res.success && res.data) setCompanies(res.data);
    });
  }, []);

  // Компани сонгоход тухайн компанийн хэлтсүүдийг ачаалах
  useEffect(() => {
    if (!form.companyId) {
      setDepartments([]);
      return;
    }
    api
      .get<DepartmentOption[]>("/departments", { companyId: form.companyId })
      .then((res) => {
        if (res.success && res.data) setDepartments(res.data);
        else setDepartments([]);
      });
  }, [form.companyId]);

  useEffect(() => {
    if (isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, router]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Нууц үг таарахгүй байна");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
      return;
    }
    if (!form.companyId) {
      toast.error("Компани сонгоно уу");
      return;
    }

    setLoading(true);
    const res = await registerUser({
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      companyId: form.companyId,
      departmentId: form.departmentId || undefined,
      position: form.position || undefined,
      phoneNumber: form.phoneNumber || undefined,
      computerNumber: form.computerNumber || undefined,
    });

    if (res.success) {
      await refreshUser();
      toast.success("Амжилттай бүртгэгдлээ");
      router.push("/tickets/create");
    } else {
      toast.error(res.message || res.errors?.[0] || "Бүртгэл амжилтгүй");
    }
    setLoading(false);
  };

  return (
    <GlassPanel variant="elevated" padding="lg" className="w-full">
      <div className="flex justify-center mb-5">
        <Logo variant="full" theme="light" />
      </div>

      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-900">Бүртгүүлэх</h1>
        <p className="text-sm text-gray-500 mt-1">Шинэ хэрэглэгч бүртгүүлэх</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Овог нэр *"
          placeholder="Бат-Эрдэнэ Болд"
          value={form.fullName}
          onChange={set("fullName")}
          icon={<User className="w-4 h-4" />}
          required
        />
        <Input
          label="Имэйл *"
          type="email"
          placeholder="email@company.mn"
          value={form.email}
          onChange={set("email")}
          icon={<Mail className="w-4 h-4" />}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Нууц үг *"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set("password")}
            icon={<Lock className="w-4 h-4" />}
            required
          />
          <Input
            label="Нууц үг давтах *"
            type="password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            icon={<Lock className="w-4 h-4" />}
            required
          />
        </div>
        <Select
          label="Компани *"
          options={[
            { value: "", label: "Компани сонгох..." },
            ...companies.map((c) => ({ value: c.id, label: c.name })),
          ]}
          value={form.companyId}
          onChange={(e) => {
            set("companyId")(e);
            // Компани солигдоход хэлтсийг арилгана
            setForm((prev) => ({ ...prev, departmentId: "" }));
          }}
          required
        />
        <Select
          label="Хэлтэс"
          options={[
            { value: "", label: form.companyId ? "Хэлтэс сонгох..." : "Эхлээд компани сонгоно уу" },
            ...departments.map((d) => ({ value: d.id, label: d.name })),
          ]}
          value={form.departmentId}
          onChange={set("departmentId")}
        />
        <Input
          label="Албан тушаал"
          placeholder="Менежер, Инженер..."
          value={form.position}
          onChange={set("position")}
          icon={<Briefcase className="w-4 h-4" />}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Утас"
            placeholder="+976 xxxxxxxx"
            value={form.phoneNumber}
            onChange={set("phoneNumber")}
            icon={<Phone className="w-4 h-4" />}
          />
          <Input
            label="Компьютерийн №"
            placeholder="PC-001"
            value={form.computerNumber}
            onChange={set("computerNumber")}
            icon={<Monitor className="w-4 h-4" />}
          />
        </div>

        <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
          Бүртгүүлэх
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-4">
        Бүртгэлтэй юу?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Нэвтрэх
        </Link>
      </p>
    </GlassPanel>
  );
}
