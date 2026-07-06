"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import type { UserRole } from "@/lib/types";

export default function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: UserRole[] }) {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (roles && userData?.banned) {
      router.replace("/");
      return;
    }
    if (roles && userData && !roles.includes(userData.role)) router.replace("/");
  }, [loading, router, roles, user, userData]);

  if (loading) return <main className="min-h-screen p-6 text-slate-300">Lädt...</main>;
  if (!user) return null;
  if (roles && userData?.banned) return null;
  if (roles && userData && !roles.includes(userData.role)) return null;
  return <>{children}</>;
}
