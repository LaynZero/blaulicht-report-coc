import { NextResponse } from "next/server";
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

export const runtime = "nodejs";

type ServiceAccountJson = { project_id: string; client_email: string; private_key: string };

function readServiceAccount(): ServiceAccountJson | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json) as ServiceAccountJson;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return { ...parsed, private_key: parsed.private_key.replace(/\\n/g, "\n") };
  } catch { return null; }
}

function getAdmin() {
  if (!getApps().length) {
    const serviceAccount = readServiceAccount();
    if (!serviceAccount) return null;
    initializeApp({ credential: cert(serviceAccount as ServiceAccount) });
  }
  return { firestore: getFirestore(), messaging: getMessaging() };
}

export async function POST(request: Request) {
  const admin = getAdmin();
  if (!admin) return NextResponse.json({ ok: false, disabled: true });

  try {
    const body = (await request.json()) as { reportId?: string; commentId?: string; authorId?: string };
    if (!body.reportId || !body.commentId) return NextResponse.json({ ok: false, message: "reportId/commentId fehlt." }, { status: 400 });

    const commentSnap = await admin.firestore.collection("reports").doc(body.reportId).collection("comments").doc(body.commentId).get();
    if (!commentSnap.exists) return NextResponse.json({ ok: false, message: "Kommentar nicht gefunden." }, { status: 404 });
    const comment = commentSnap.data() ?? {};
    const mentions = Array.isArray(comment.mentions) ? comment.mentions.map(String) : [];
    if (!mentions.length) return NextResponse.json({ ok: true, sent: 0 });

    const tokensSnap = await admin.firestore.collection("pushTokens").where("active", "==", true).limit(500).get();
    const tokens = tokensSnap.docs
      .filter((doc) => {
        const data = doc.data();
        if (data.uid === body.authorId) return false;
        return data.mentions !== false && data.username && mentions.includes(String(data.username));
      })
      .map((doc) => String(doc.data().token || doc.id))
      .filter(Boolean);

    if (!tokens.length) return NextResponse.json({ ok: true, sent: 0 });

    const response = await admin.messaging.sendEachForMulticast({
      tokens,
      notification: { title: "Du wurdest erwähnt", body: `${comment.authorName || "Jemand"}: ${String(comment.text || "").slice(0, 120)}` },
      data: { reportId: body.reportId, url: "/" },
      webpush: { fcmOptions: { link: "/" }, notification: { icon: "/icon-192.png", badge: "/icon-192.png", tag: `mention-${body.commentId}` } },
    });

    return NextResponse.json({ ok: true, sent: response.successCount, failed: response.failureCount });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Push konnte nicht gesendet werden." }, { status: 500 });
  }
}
