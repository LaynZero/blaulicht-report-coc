import { NextResponse } from "next/server";
import { getMessagingAdmin } from "@/lib/server/pushMessaging";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const admin = getMessagingAdmin();
  if (!admin) return NextResponse.json({ ok: false, disabled: true, message: "FIREBASE_SERVICE_ACCOUNT_KEY fehlt." });

  const body = (await request.json()) as { uid?: string };
  if (!body.uid) return NextResponse.json({ ok: false, message: "uid fehlt." }, { status: 400 });

  const tokensSnap = await admin.firestore.collection("pushTokens").where("active", "==", true).where("uid", "==", body.uid).limit(10).get();
  const tokens = tokensSnap.docs.map((doc) => String(doc.data().token || doc.id)).filter(Boolean);
  if (!tokens.length) return NextResponse.json({ ok: false, message: "Kein aktiver Push-Token für diesen User gefunden." }, { status: 404 });

  const response = await admin.messaging.sendEachForMulticast({
    tokens,
    // Data-only payload, see report-created/route.ts for why (avoids double notifications).
    data: { title: "🔔 Test-Benachrichtigung", body: "Push funktioniert auf diesem Gerät.", url: "/profile", tag: "push-test" },
    webpush: { fcmOptions: { link: `${new URL(request.url).origin}/profile` } },
  });

  return NextResponse.json({ ok: true, sent: response.successCount, failed: response.failureCount });
}
