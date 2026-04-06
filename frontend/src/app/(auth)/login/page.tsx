"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GlassPanel, Button, Input } from "@/components/ui";
import { Logo } from "@/components/layout/Logo";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push("/dashboard");
    return null;
  }

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
    <GlassPanel variant="elevated" padding="lg" className="w-full">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <Logo variant="full" theme="light" />
      </div>

      <div className="text-center mb-8">
        <h1 className="text-xl font-bold text-gray-900">
          Тусламжийн систем
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Системд нэвтрэх
        </p>
      </div>

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
        <Button
          type="submit"
          loading={loading}
          className="w-full mt-2"
          size="lg"
        >
          Нэвтрэх
        </Button>
      </form>
    </GlassPanel>
  );
}
