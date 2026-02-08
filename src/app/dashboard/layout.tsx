"use client";

import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentMode, sidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Wait for the store to hydrate
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // If already hydrated, set immediately
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isHydrated && !user) {
      router.push("/auth/login");
    }
  }, [user, router, isHydrated]);

  // Don't render anything until hydrated
  if (!isHydrated || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)]">
        {currentMode === "advanced" && <Sidebar />}
        <main
          className={cn(
            "flex-1 overflow-auto p-4 md:p-6 transition-all duration-300",
            currentMode === "advanced" && "md:ml-64"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
