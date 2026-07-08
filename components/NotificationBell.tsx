"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CheckCheck, Trash2, X } from "lucide-react";
import { collection, deleteDoc, doc, limit, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/firebase";
import { formatRelativeTime } from "@/lib/helpers";
import type { AppNotification } from "@/lib/types";

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    const q = query(collection(db, "notifications"), where("userId", "==", user.uid), limit(30));
    const unsub = onSnapshot(q, (snap) => {
      const nextItems = snap.docs.map((item) => ({ id: item.id, ...item.data() }) as AppNotification);
      nextItems.sort((a, b) => Number((b.createdAt as { seconds?: number })?.seconds ?? 0) - Number((a.createdAt as { seconds?: number })?.seconds ?? 0));
      setItems(nextItems);
    });
    return () => unsub();
  }, [user]);

  const unread = items.filter((item) => !item.read).length;

  async function markAllRead() {
    await Promise.all(items.filter((item) => !item.read).map((item) => updateDoc(doc(db, "notifications", item.id), { read: true })));
  }

  async function clearRead() {
    await Promise.all(items.filter((item) => item.read).map((item) => deleteDoc(doc(db, "notifications", item.id))));
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-200 hover:bg-slate-800"
        aria-label="Benachrichtigungen öffnen"
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-4 right-4 top-20 z-50 mx-auto max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/60 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div>
              <p className="text-lg font-black text-white">🔔 Benachrichtigungen</p>
              <p className="text-xs text-slate-400">Erwähnungen und wichtige Hinweise</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-xl bg-slate-900 p-2 text-slate-300 hover:bg-slate-800">
              <X size={16} />
            </button>
          </div>

          <div className="flex gap-2 border-b border-white/10 p-3">
            <button onClick={markAllRead} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2 text-xs font-black text-white">
              <CheckCheck size={14} /> Alle gelesen
            </button>
            <button onClick={clearRead} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-800 py-2 text-xs font-black text-slate-200">
              <Trash2 size={14} /> Gelesene löschen
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-3">
            {items.length === 0 && <p className="rounded-2xl bg-slate-900 p-4 text-sm text-slate-400">Noch keine Benachrichtigungen.</p>}
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.reportId ? `/report/${item.reportId}` : "/support"}
                onClick={async () => {
                  setOpen(false);
                  if (!item.read) await updateDoc(doc(db, "notifications", item.id), { read: true });
                }}
                className={`mb-2 block rounded-2xl border p-4 ${item.read ? "border-white/5 bg-slate-900/60" : "border-blue-400/30 bg-blue-600/10"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-black text-white">{item.title}</p>
                  <span className="shrink-0 text-[11px] text-slate-500">{formatRelativeTime(item.createdAt)}</span>
                </div>
                <p className="mt-1 overflow-wrap-anywhere line-clamp-3 break-words text-sm text-slate-300">{item.body}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
