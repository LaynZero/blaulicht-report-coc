import { NextResponse } from "next/server";
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

export const runtime = "nodejs";

type ServiceAccountJson = { project_id: string; client_email: string; private_key: string };

type PushTokenDoc = {
  token?: string;
  uid?: string;
  username?: string;
  active?: boolean;
  categories?: string[];
  official?: boolean;
  emergency?: boolean;
  mentions?: boolean;
};

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
  if (!admin) {
    return NextResponse.json({ ok: false, disabled: true, message: "FIREBASE_SERVICE_ACCOUNT_KEY fehlt." });
  }

  try {
    const body = (await request.json()) as { reportId?: string; authorId?: string };
    if (!body.reportId) return NextResponse.json({ ok: false, message: "reportId fehlt." }, { status: 400 });

    const reportSnap = await admin.firestore.collection("reports").doc(body.reportId).get();
    if (!reportSnap.exists) return NextResponse.json({ ok: false, message: "Meldung nicht gefunden." }, { status: 404 });

    const report = reportSnap.data() ?? {};
    const category = String(report.category ?? "Neue Meldung");
    const location = String(report.location ?? "").trim();
    const description = String(report.description ?? "").trim();
    const official = report.official === true;
    const emergency = report.emergency === true;
    const mentions = Array.isArray(report.mentions) ? report.mentions.map(String).filter(Boolean).slice(0, 10) : [];

    const mentionedUids = new Set<string>();
    for (const mentionChunk of chunk(mentions)) {
      if (!mentionChunk.length) continue;
      const usersSnap = await admin.firestore.collection("users").where("username", "in", mentionChunk).get();
      usersSnap.docs.forEach((userDoc) => {
        const userData = userDoc.data();
        const uid = String(userData.uid || userDoc.id);
        if (uid && uid !== body.authorId) mentionedUids.add(uid);
      });
    }

    const tokensSnap = await admin.firestore.collection("pushTokens").where("active", "==", true).limit(1000).get();

    const tokens = tokensSnap.docs
      .filter((tokenDoc) => {
        const data = tokenDoc.data() as PushTokenDoc;
        if (data.uid === body.authorId) return false;
        if (emergency) return data.emergency !== false;
        if (data.uid && mentionedUids.has(data.uid)) return data.mentions !== false;
        if (official && data.official === false) return false;
        const categories = Array.isArray(data.categories) ? data.categories.map(String) : [];
        return categories.length === 0 || categories.includes(category);
      })
      .map((tokenDoc) => String((tokenDoc.data() as PushTokenDoc).token || tokenDoc.id))
      .filter(Boolean);

    if (!tokens.length) return NextResponse.json({ ok: true, sent: 0, reason: "Keine passenden Push-Tokens gefunden." });

    const title = emergency ? "🚨 EILMELDUNG" : official ? "Offizieller Blaulicht-Post" : `Neue Meldung: ${category}`;
    const bodyText = [location, description].filter(Boolean).join(" · ").slice(0, 130) || "Neue Meldung im Blaulicht Report COC";
    const url = `/report/${body.reportId}`;
    const absoluteUrl = `${getOrigin(request)}${url}`;

    let successCount = 0;
    let failureCount = 0;
    const invalidTokens: string[] = [];

    for (const tokenChunk of chunk(tokens, 500)) {
      const response = await admin.messaging.sendEachForMulticast({
        tokens: tokenChunk,
        notification: { title, body: bodyText },
        data: { reportId: body.reportId, url },
        webpush: {
          fcmOptions: { link: absoluteUrl },
          notification: { icon: "/icon-192.png", badge: "/icon-192.png", tag: `report-${body.reportId}` },
        },
      });
      successCount += response.successCount;
      failureCount += response.failureCount;
      response.responses.forEach((item, index) => {
        if (!item.success) {
          const code = item.error?.code || "";
          if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) invalidTokens.push(tokenChunk[index]);
        }
      });
    }

    await Promise.all(invalidTokens.map((token) => admin.firestore.collection("pushTokens").doc(token).set({ active: false }, { merge: true })));

    return NextResponse.json({ ok: true, sent: successCount, failed: failureCount });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Push konnte nicht gesendet werden." }, { status: 500 });
  }
}
