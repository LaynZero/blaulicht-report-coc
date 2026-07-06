"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { auth } from "@/app/firebase";
import { signOut } from "firebase/auth";
import RoleBadge from "./ui/RoleBadge";

export default function UserStatus() {
  const { userData, loading } = useAuth();

  if (loading) return <span className="text-xs text-slate-500">...</span>;

  if (!userData) {
    return (
      <Link href="/login" className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white">
        Login
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/profile" className="hidden text-right text-xs sm:block">
        <p className="font-black leading-none">{userData.displayName}</p>
        <p className="text-slate-400">@{userData.username}</p>
      </Link>
      <div className="hidden sm:block"><RoleBadge role={userData.role} /></div>
      <button
        onClick={async () => signOut(auth)}
        className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200"
      >
        Logout
      </button>
    </div>
  );
}
