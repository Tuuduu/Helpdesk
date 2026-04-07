"use client";

import { cn } from "@/lib/utils";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Spinner } from "@/components/ui";

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--body-bg)" }}>
      <Sidebar />
      <MobileNav />
      <main
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          "md:ml-20",
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        )}
      >
        <Topbar />
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
}
