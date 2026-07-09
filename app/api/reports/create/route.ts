import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdmin, getVerifiedUser, jsonError } from "@/lib/server/adminAuth";
import { extractMentions, reportCategories } from "@/lib/helpers";
import type { ReportCategory, ReportPostType } from "@/lib/types";

export const runtime = "nodejs";

// Minimum time a single user must wait between two reports. Staff (admin/developer)
// are exempt so they can still post urgent official/emergency updates back-to-back.
const RATE_LIMIT_MS = 30_000;
const REPORT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_LOCATION_LENGTH = 200;

const validCategories = new Set<string>(reportCategories.map((item) => item.value));

type CreateReportBody = {
  category?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  audioUrl?: string;
  audioMimeType?: string;
  audioDurationSeconds?: number;
  official?: boolean;
  emergency?: boolean;
};

export async function POST(request: Request) {
  const admin = getAdmin();
  if (!admin) return jsonError("FIREBASE_SERVICE_ACCOUNT_KEY fehlt oder ist ungültig.", 500);

  try {
    const requester = await getVerifiedUser(request, admin);
    if (!requester) return jsonError("Kein Zugriff. Bitte erneut einloggen.", 401);
    if (requester.banned) return jsonError("Dein Account ist gesperrt. Du kannst keine Beiträge mehr erstellen.", 403);

    const isStaff = requester.role === "admin" || requester.role === "developer";
    if (!isStaff) {
      const lastReportMs = requester.lastReportAt?.toMillis?.() ?? 0;
      const waitedMs = Date.now() - lastReportMs;
      if (lastReportMs && waitedMs < RATE_LIMIT_MS) {
        const remainingSeconds = Math.ceil((RATE_LIMIT_MS - waitedMs) / 1000);
        return jsonError(`Bitte warte noch ${remainingSeconds} Sekunden, bevor du eine neue Meldung erstellst.`, 429);
      }
    }

    const body = (await request.json()) as CreateReportBody;
    const category = body.category as ReportCategory;
    if (!validCategories.has(category)) return jsonError("Ungültige Kategorie.", 400);

    const location = (body.location || "").trim().slice(0, MAX_LOCATION_LENGTH);
    const description = (body.description || "").trim().slice(0, MAX_DESCRIPTION_LENGTH);
    const imageUrl = (body.imageUrl || "").trim();
    const audioUrl = (body.audioUrl || "").trim();
    const hasAudio = Boolean(audioUrl);

    if (!hasAudio && description.length < 1) return jsonError("Bitte schreibe mindestens 1 Zeichen oder nimm eine Sprachnachricht auf.", 400);
    // Only Storage URLs from our own bucket are accepted, never arbitrary client-supplied URLs/markup.
    if (imageUrl && !imageUrl.startsWith("https://firebasestorage.googleapis.com/")) return jsonError("Ungültige Bild-URL.", 400);
    if (audioUrl && !audioUrl.startsWith("https://firebasestorage.googleapis.com/")) return jsonError("Ungültige Audio-URL.", 400);

    // Never trust the client's official/emergency request directly — only staff can elevate a post.
    const finalOfficial = Boolean(body.official && isStaff) || Boolean(body.emergency && isStaff);
    const finalEmergency = Boolean(body.emergency && isStaff);
    const postType: ReportPostType = finalEmergency && hasAudio ? "emergency_voice" : finalEmergency ? "emergency" : finalOfficial && hasAudio ? "official_voice" : finalOfficial ? "official" : hasAudio ? "voice" : "report";

    const mentions = extractMentions(description);
    const now = Date.now();

    const reportRef = admin.firestore.collection("reports").doc();
    const userRef = admin.firestore.collection("users").doc(requester.uid);

    const batch = admin.firestore.batch();
    batch.set(reportRef, {
      category,
      location,
      description,
      authorId: requester.uid,
      authorName: requester.displayName,
      authorRole: requester.role,
      authorUsername: requester.username,
      authorAvatarDataUrl: requester.avatarDataUrl,
      confirmations: [],
      confirmedBy: [],
      outdatedBy: [],
      reports: [],
      commentsCount: 0,
      status: "new",
      pinned: finalOfficial,
      official: finalOfficial,
      emergency: finalEmergency,
      postType,
      imageDataUrl: imageUrl,
      mentions,
      audioDataUrl: audioUrl,
      audioMimeType: hasAudio ? body.audioMimeType || "" : "",
      audioDurationSeconds: hasAudio ? Math.max(0, Math.round(body.audioDurationSeconds || 0)) : 0,
      latitude: null,
      longitude: null,
      locationSource: "manual",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      // Firestore TTL policy on this field (see README) auto-deletes the report ~24h after creation.
      expiresAt: Timestamp.fromMillis(now + REPORT_TTL_MS),
    });
    batch.update(userRef, {
      reportsCount: FieldValue.increment(1),
      trustPoints: FieldValue.increment(finalEmergency ? 15 : finalOfficial ? 8 : 5),
      lastReportAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    return NextResponse.json({ ok: true, reportId: reportRef.id, mentions });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Meldung konnte nicht erstellt werden.", 500);
  }
}
