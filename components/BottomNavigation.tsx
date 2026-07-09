"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Info, MessageCircle, Plus, Shield, UserRound } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useSupportBadgeCounts } from "@/lib/hooks/useSupportBadgeCounts";

function NavItem({ href, icon: Icon, label, badgeCount }: { href: string; icon: ElementType; label: string; badgeCount?: number }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 transition ${active ? "text-blue-300" : "text-slate-400 hover:text-white"}`}
    >
      <span className="relative">
        <Icon size={22} strokeWidth={active ? 3 : 2.2} />
        {Boolean(badgeCount) && (
          <span
            className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black leading-none text-white ring-2 ring-slate-950"
            aria-label={`${badgeCount} offen`}
          >
            {badgeCount! > 9 ? "9+" : badgeCount}
          </span>
        )}
      </span>
      <span className="text-[10px] font-black leading-none">{label}</span>
    </Link>
  );
}

export default function BottomNavigation() {
  const pathname = usePathname();
  const { userData } = useAuth();
  const isPrivileged = userData?.role === "admin" || userData?.role === "developer";
  const isReportActive = pathname === "/report";
  const { openForStaff, answeredForUser } = useSupportBadgeCounts();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
      <div className="mx-auto grid max-w-md grid-cols-[1fr_1fr_76px_1fr_1fr] items-center rounded-[2rem] border border-white/10 bg-slate-950/92 px-3 py-3 text-slate-400 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        <NavItem href="/" icon={Home} label="Feed" />
        <NavItem href="/support" icon={MessageCircle} label="Support" badgeCount={answeredForUser} />

        <div className="flex justify-center">
          <Link
            href="/report"
            aria-label="Neue Meldung erstellen"
            className={`-mt-11 flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-950 bg-gradient-to-br from-blue-500 via-violet-500 to-red-500 text-white shadow-2xl shadow-blue-500/25 transition hover:scale-105 active:scale-95 ${isReportActive ? "ring-4 ring-blue-300/30" : ""}`}
          >
            <Plus size={34} strokeWidth={3.2} />
          </Link>
        </div>

        <NavItem href="/profile" icon={UserRound} label="Profil" />
        {isPrivileged ? <NavItem href="/admin" icon={Shield} label="Admin" badgeCount={openForStaff} /> : <NavItem href="/info" icon={Info} label="Info" />}
      </div>
    </nav>
  );
}
