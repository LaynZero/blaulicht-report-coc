"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, limit, onSnapshot, query, where } from "firebase/firestore";
import BottomNavigation from "@/components/BottomNavigation";
import RoleBadge from "@/components/ui/RoleBadge";
import UserAvatar from "@/components/ui/UserAvatar";
import { db } from "@/app/firebase";
import type { AppUser, Report } from "@/lib/types";
import { categoryEmoji, formatRelativeTime } from "@/lib/helpers";
import { MessageCircle, Shield, Siren } from "lucide-react";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username).toLowerCase();
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubReports: (() => void) | undefined;

    async function loadProfile() {
      setLoading(true);
      const usernameSnap = await getDoc(doc(db, "usernames", username));
      if (!usernameSnap.exists()) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const uid = usernameSnap.data().uid as string;
      const userSnap = await getDoc(doc(db, "users", uid));
      if (!userSnap.exists()) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const data = userSnap.data() as AppUser;
      setProfile(data);
      setLoading(false);

      const reportsQuery = query(collection(db, "reports"), where("authorId", "==", uid), limit(20));
      unsubReports = onSnapshot(reportsQuery, (snap) => {
        const items = snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Report);
        setReports(items);
      });
    }

    loadProfile().catch(() => setLoading(false));
    return () => unsubReports?.();
  }, [username]);

  return (
    <main className="min-h-screen px-5 pb-28 pt-8 text-white">
      <section className="mx-auto max-w-md space-y-5">
        {loading ? (
          <div className="glass-card rounded-3xl p-6 text-center text-slate-400">Profil wird geladen...</div>
        ) : !profile ? (
          <div className="glass-card rounded-3xl p-6 text-center">
            <h1 className="text-2xl font-black">Profil nicht gefunden</h1>
            <Link href="/" className="mt-4 inline-block rounded-2xl bg-blue-600 px-5 py-3 font-bold">Zurück zum Feed</Link>
          </div>
        ) : (
          <>
            <div className="glass-card rounded-3xl p-6 text-center">
              <div className="mx-auto mb-4 flex justify-center">
                <UserAvatar src={profile.avatarDataUrl} name={profile.displayName} size="xl" className="blue-glow" />
              </div>
              <h1 className="break-words text-3xl font-black">{profile.displayName}</h1>
              <p className="mt-1 break-words text-slate-400">@{profile.username}</p>
              <div className="mt-3"><RoleBadge role={profile.role} /></div>
              {profile.bio && <p className="mt-4 whitespace-pre-line break-words text-sm text-slate-300">{profile.bio}</p>}
              {profile.location && <p className="mt-3 text-sm text-slate-400">📍 {profile.location}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card rounded-2xl p-4 text-center"><Siren className="mx-auto mb-2 text-blue-400" size={22} /><p className="text-xl font-bold">{profile.reportsCount ?? 0}</p><p className="text-xs text-slate-400">Beiträge</p></div>
              <div className="glass-card rounded-2xl p-4 text-center"><Shield className="mx-auto mb-2 text-green-400" size={22} /><p className="text-xl font-bold">{profile.trustPoints ?? 0}</p><p className="text-xs text-slate-400">Punkte</p></div>
              <div className="glass-card rounded-2xl p-4 text-center"><MessageCircle className="mx-auto mb-2 text-purple-400" size={22} /><p className="text-xl font-bold">{profile.commentsCount ?? 0}</p><p className="text-xs text-slate-400">Kommentare</p></div>
            </div>

            <div className="glass-card rounded-3xl p-5">
              <h2 className="mb-4 text-xl font-black">Letzte Beiträge</h2>
              {reports.length === 0 ? (
                <p className="text-sm text-slate-400">Noch keine öffentlichen Beiträge.</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => (
                    <div key={report.id} className="rounded-2xl bg-slate-950/60 p-4">
                      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-400">
                        <span>{categoryEmoji(report.category)} {report.category}</span>
                        <span>{formatRelativeTime(report.createdAt)}</span>
                      </div>
                      <p className="font-bold text-slate-200">{report.location || "Ohne Ortsangabe"}</p>
                      {report.description && <p className="mt-1 whitespace-pre-line break-words text-sm text-slate-400">{report.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
      <BottomNavigation />
    </main>
  );
}
