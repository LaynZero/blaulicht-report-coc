"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function BottomNavigation() {
  const pathname = usePathname();
  const { userData } = useAuth();
  const isPrivileged = userData?.role === "admin" || userData?.role === "developer";

  const items = [
    { href: "/", icon: "🏠", label: "Feed", show: true },
    { href: "/report", icon: "➕", label: "Melden", show: true },
    { href: "/map", icon: "🗺️", label: "Karte", show: true },
    { href: "/admin", icon: "🛡️", label: "Admin", show: isPrivileged },
    { href: "/profile", icon: "👤", label: "Profil", show: true },
  ].filter((item) => item.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md justify-between text-xs text-slate-300">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 ${active ? "text-blue-400" : ""}`}>
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
