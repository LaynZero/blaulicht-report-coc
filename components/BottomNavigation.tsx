"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPinned, Plus, Shield, UserRound } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

const baseItems = [
  { href: "/", icon: Home, label: "Feed", show: true },
  { href: "/map", icon: MapPinned, label: "Karte", show: true },
  { href: "/profile", icon: UserRound, label: "Profil", show: true },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { userData } = useAuth();
  const isPrivileged = userData?.role === "admin" || userData?.role === "developer";

  const items = [
    baseItems[0],
    baseItems[1],
    ...(isPrivileged ? [{ href: "/admin", icon: Shield, label: "Admin", show: true }] : []),
    baseItems[2],
  ];

  const isReportActive = pathname === "/report";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
      <div className="mx-auto flex max-w-md items-center justify-around rounded-[2rem] border border-white/10 bg-slate-950/90 px-3 py-3 text-[11px] font-bold text-slate-400 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-14 flex-col items-center gap-1 rounded-2xl px-2 py-1 transition ${active ? "text-blue-300" : "hover:text-white"}`}
            >
              <Icon size={22} strokeWidth={active ? 3 : 2.2} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <Link
          href="/report"
          aria-label="Neue Meldung erstellen"
          className={`-mt-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-950 bg-gradient-to-br from-blue-500 to-red-500 text-white shadow-xl shadow-blue-500/25 transition active:scale-95 ${isReportActive ? "ring-4 ring-blue-300/30" : ""}`}
        >
          <Plus size={34} strokeWidth={3.2} />
        </Link>

        {items.slice(2).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-14 flex-col items-center gap-1 rounded-2xl px-2 py-1 transition ${active ? "text-blue-300" : "hover:text-white"}`}
            >
              <Icon size={22} strokeWidth={active ? 3 : 2.2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
