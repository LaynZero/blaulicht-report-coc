"use client";

import { useAuth } from "../app/context/AuthContext";
import { auth } from "../app/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function UserStatus() {
  const { userData, loading } = useAuth();
  const router = useRouter();

  if (loading) return null;

  if (!userData) {
    return (
      <button onClick={() => router.push("/login")}>
        Einloggen
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span>
        Angemeldet als <b>{userData.displayName}</b>
      </span>

      <button
        onClick={async () => {
          await signOut(auth);
          router.push("/login");
        }}
        className="bg-red-600 text-white px-3 py-1 rounded"
      >
        Logout
      </button>
    </div>
  );
}