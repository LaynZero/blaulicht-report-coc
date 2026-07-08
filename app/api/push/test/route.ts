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
  if (!admin) return NextResponse.json({ ok: false, disabled: true, message: "FIREBASE_SERVICE_ACCOUNT_KEY fehlt." });

  const body = (await request.json()) as { uid?: string };
  if (!body.uid) return NextResponse.json({ ok: false, message: "uid fehlt." }, { status: 400 });

  const tokensSnap = await admin.firestore.collection("pushTokens").where("active", "==", true).where("uid", "==", body.uid).limit(10).get();
  const tokens = tokensSnap.docs.map((doc) => String(doc.data().token || doc.id)).filter(Boolean);
  if (!tokens.length) return NextResponse.json({ ok: false, message: "Kein aktiver Push-Token für diesen User gefunden." }, { status: 404 });

  const response = await admin.messaging.sendEachForMulticast({
    tokens,
    notification: { title: "🔔 Test-Benachrichtigung", body: "Push funktioniert auf diesem Gerät." },
    data: { url: "/profile" },
    webpush: { fcmOptions: { link: `${new URL(request.url).origin}/profile` }, notification: { icon: "/icon-192.png", badge: "/icon-192.png", tag: "push-test" } },
  });

  return NextResponse.json({ ok: true, sent: response.successCount, failed: response.failureCount });
}
