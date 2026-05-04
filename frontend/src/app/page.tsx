"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDefaultPathForRole } from "@/lib/utils";
import { Spinner } from "@/components/ui";

export default function HomePage() {
  const { isLoading, isAuthenticated, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && role) {
      router.replace(getDefaultPathForRole(role));
    } else {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, role, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
