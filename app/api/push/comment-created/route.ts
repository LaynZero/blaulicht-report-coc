import { NextResponse } from "next/server";
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

export const runtime = "nodejs";

type ServiceAccountJson = { project_id: string; client_email: string; private_key: string };

type PushTokenDoc = { token?: string; uid?: string; active?: boolean; mentions?: boolean };

function readServiceAccount(): ServiceAccountJson | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json) as ServiceAccountJson;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return { ...parsed, private_key: parsed.private_key.replace(/\\n/g, "\n") };
  } catch {
    return null;
  }
}

function getAdmin() {
  if (!getApps().length) {
    const serviceAccount = readServiceAccount();
    if (!serviceAccount) return null;
    initializeApp({ credential: cert(serviceAccount as ServiceAccount) });
  }
  return { firestore: getFirestore(), messaging: getMessaging() };
}

function getOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return new URL(request.url).origin;
}

function chunk<T>(items: T[], size = 10) {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

export async function POST(request: Request) {
  const admin = getAdmin();
  if (!admin) return NextResponse.json({ ok: false, disabled: true, message: "FIREBASE_SERVICE_ACCOUNT_KEY fehlt." });

  try {
    const body = (await request.json()) as { reportId?: string; commentId?: string; authorId?: string };
    if (!body.reportId || !body.commentId) return NextResponse.json({ ok: false, message: "reportId/commentId fehlt." }, { status: 400 });

    const commentSnap = await admin.firestore.collection("reports").doc(body.reportId).collection("comments").doc(body.commentId).get();
    if (!commentSnap.exists) return NextResponse.json({ ok: false, message: "Kommentar nicht gefunden." }, { status: 404 });

    const comment = commentSnap.data() ?? {};
    const mentions = Array.isArray(comment.mentions) ? comment.mentions.map(String).filter(Boolean).slice(0, 10) : [];
    if (!mentions.length) return NextResponse.json({ ok: true, sent: 0 });

    const targetUids = new Set<string>();
    for (const mentionChunk of chunk(mentions)) {
      if (!mentionChunk.length) continue;
      const usersSnap = await admin.firestore.collection("users").where("username", "in", mentionChunk).get();
      usersSnap.docs.forEach((userDoc) => {
        const userData = userDoc.data();
        const uid = String(userData.uid || userDoc.id);
        if (uid && uid !== body.authorId) targetUids.add(uid);
      });
    }

    if (!targetUids.size) return NextResponse.json({ ok: true, sent: 0, reason: "Keine erwähnten User gefunden." });

    const tokens: string[] = [];
    for (const uidChunk of chunk([...targetUids])) {
      const tokensSnap = await admin.firestore.collection("pushTokens").where("active", "==", true).where("uid", "in", uidChunk).get();
      tokensSnap.docs.forEach((tokenDoc) => {
        const data = tokenDoc.data() as PushTokenDoc;
        if (data.mentions === false) return;
        const token = String(data.token || tokenDoc.id);
        if (token) tokens.push(token);
      });
    }

    if (!tokens.length) return NextResponse.json({ ok: true, sent: 0, reason: "Keine Push-Tokens für erwähnte User." });

    const url = `/report/${body.reportId}`;
    const absoluteUrl = `${getOrigin(request)}${url}`;
    const response = await admin.messaging.sendEachForMulticast({
      tokens,
      notification: { title: "Du wurdest erwähnt", body: `${comment.authorName || "Jemand"}: ${String(comment.text || "").slice(0, 120)}` },
      data: { reportId: body.reportId, commentId: body.commentId, url },
      webpush: { fcmOptions: { link: absoluteUrl }, notification: { icon: "/icon-192.png", badge: "/icon-192.png", tag: `mention-${body.commentId}` } },
    });

    return NextResponse.json({ ok: true, sent: response.successCount, failed: response.failureCount });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Push konnte nicht gesendet werden." }, { status: 500 });
  }
}
