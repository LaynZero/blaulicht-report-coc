"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, increment, serverTimestamp, updateDoc } from "firebase/firestore";
import { Mic, Square } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/firebase";
import { reportCategories } from "@/lib/helpers";
import type { ReportCategory, ReportPostType } from "@/lib/types";

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function ReportPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [category, setCategory] = useState<ReportCategory>("Verkehrskontrolle");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [official, setOfficial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioDataUrl, setAudioDataUrl] = useState("");
  const [audioMimeType, setAudioMimeType] = useState("");
  const [audioDurationSeconds, setAudioDurationSeconds] = useState(0);
  const recordingStartedAtRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const canMakeOfficialPost = userData?.role === "admin" || userData?.role === "developer";
  const banned = userData?.banned === true;
  const hasAudio = Boolean(audioDataUrl);

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Dein Browser unterstützt Sprachnachrichten leider nicht.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const dataUrl = await blobToDataUrl(blob);
        setAudioDataUrl(dataUrl);
        setAudioMimeType(blob.type);
        setAudioDurationSeconds(recordingStartedAtRef.current ? Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000)) : 0);
        recordingStartedAtRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      alert("Mikrofon-Zugriff wurde verweigert oder ist nicht verfügbar.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  async function createReport(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !userData) return;
    if (banned) return alert("Dein Account ist gesperrt. Du kannst keine Beiträge mehr erstellen.");
    if (!hasAudio && description.trim().length < 1) return alert("Bitte schreibe mindestens 1 Zeichen oder nimm eine Sprachnachricht auf.");
    if (audioDataUrl.length > 850000) return alert("Die Sprachnachricht ist zu lang. Bitte nimm sie kürzer auf, damit sie in Firestore gespeichert werden kann.");

    setLoading(true);
    try {
      const postType: ReportPostType = official && hasAudio ? "official_voice" : official ? "official" : hasAudio ? "voice" : "report";

      await addDoc(collection(db, "reports"), {
        category,
        location: location.trim(),
        description: description.trim(),
        authorId: user.uid,
        authorName: userData.displayName,
        authorRole: userData.role,
        confirmations: [user.uid],
        reports: [],
        commentsCount: 0,
        status: "new",
        pinned: official,
        official,
        postType,
        audioDataUrl: audioDataUrl || "",
        audioMimeType: audioMimeType || "",
        audioDurationSeconds: audioDurationSeconds || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "users", user.uid), {
        reportsCount: increment(1),
        trustPoints: increment(official ? 8 : 5),
      });
      router.push("/");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Meldung konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-950 px-5 pb-28 pt-8 text-white">
        <form onSubmit={createReport} className="mx-auto max-w-md space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">Neue Meldung</p>
            <h1 className="text-3xl font-black">🚨 Was ist los?</h1>
            <p className="mt-2 text-sm text-slate-400">Bitte nur echte, aktuelle und hilfreiche Meldungen posten.</p>
          </div>

          {banned && (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
              Dein Account ist gesperrt. Du kannst keine Beiträge mehr erstellen.
            </div>
          )}

          {canMakeOfficialPost && (
            <label className="flex items-start gap-3 rounded-2xl border border-blue-400/30 bg-blue-600/10 p-4">
              <input type="checkbox" checked={official} onChange={(e) => setOfficial(e.target.checked)} className="mt-1 h-5 w-5" />
              <span>
                <b>Offiziellen Admin/Entwickler-Post erstellen</b>
                <span className="mt-1 block text-sm text-slate-400">Der Beitrag wird hervorgehoben und oben angepinnt.</span>
              </span>
            </label>
          )}

          <div>
            <label className="mb-2 block font-bold">Kategorie</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ReportCategory)} className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4">
              {reportCategories.map((item) => <option key={item.value} value={item.value}>{item.icon} {item.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-bold">Ort <span className="text-sm font-normal text-slate-500">optional</span></label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4" placeholder="z.B. Cochem B49, Zell Brücke oder frei lassen" />
          </div>

          <div>
            <label className="mb-2 block font-bold">Beschreibung <span className="text-sm font-normal text-slate-500">mind. 1 Zeichen oder Audio</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="w-full rounded-2xl border border-slate-700 bg-slate-900 p-4" placeholder="z.B. AVK, Blitzer B49, Stau Richtung Cochem..." />
          </div>

          <div className="rounded-3xl border border-violet-400/20 bg-violet-500/10 p-4">
            <p className="mb-3 font-black">🎙️ Sprachnachricht statt Text</p>
            <p className="mb-4 text-sm text-slate-400">Für den Anfang wird Audio direkt in Firestore gespeichert. Nimm es deshalb kurz auf, am besten unter 30–45 Sekunden.</p>
            {!isRecording ? (
              <button type="button" onClick={startRecording} disabled={banned} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3 font-black disabled:opacity-50">
                <Mic size={18} /> Aufnahme starten
              </button>
            ) : (
              <button type="button" onClick={stopRecording} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 font-black">
                <Square size={18} /> Aufnahme stoppen
              </button>
            )}
            {audioDataUrl && (
              <div className="mt-4 rounded-2xl bg-slate-950/60 p-3">
                <audio src={audioDataUrl} controls className="w-full" />
                <button type="button" onClick={() => { setAudioDataUrl(""); setAudioMimeType(""); setAudioDurationSeconds(0); }} className="mt-3 w-full rounded-xl bg-slate-800 py-2 text-sm font-bold">
                  Aufnahme löschen
                </button>
              </div>
            )}
          </div>

          <button disabled={loading || banned} className="w-full rounded-2xl bg-blue-600 py-4 text-lg font-black shadow-lg shadow-blue-600/30 disabled:opacity-60">
            {loading ? "Wird veröffentlicht..." : official ? "Offiziellen Post veröffentlichen" : "Meldung veröffentlichen"}
          </button>
        </form>
        <BottomNavigation />
      </main>
    </ProtectedRoute>
  );
}
