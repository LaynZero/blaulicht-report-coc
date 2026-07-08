import { NextResponse } from "next/server";
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

export const runtime = "nodejs";

type ServiceAccountJson = {
  project_id: string;
  client_email: string;
  private_key: string;
};

function readServiceAccount(): ServiceAccountJson | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;

  try {
    const json = raw.trim().startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");

    const parsed = JSON.parse(json) as ServiceAccountJson;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;

    return {
      ...parsed,
      private_key: parsed.private_key.replace(/\\n/g, "\n"),
    };
  } catch {
    return null;
  }
}

function getAdmin() {
  if (getApps().length) {
    const firestore = getFirestore();
    const messaging = getMessaging();
    return { firestore, messaging };
  }

  const serviceAccount = readServiceAccount();
  if (!serviceAccount) return null;

  initializeApp({
    credential: cert(serviceAccount as ServiceAccount),
  });

  return {
    firestore: getFirestore(),
    messaging: getMessaging(),
  };
}

export async function POST(request: Request) {
  const admin = getAdmin();

  if (!admin) {
    return NextResponse.json({
      ok: false,
      disabled: true,
      message: "FIREBASE_SERVICE_ACCOUNT_KEY fehlt. Push-Versand ist vorbereitet, aber serverseitig noch nicht verbunden.",
    });
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

    const tokensSnap = await admin.firestore
      .collection("pushTokens")
      .where("active", "==", true)
      .limit(500)
      .get();

    const tokens = tokensSnap.docs
      .filter((doc) => doc.data().uid !== body.authorId)
      .map((doc) => String(doc.data().token || doc.id))
      .filter(Boolean);

    if (tokens.length === 0) return NextResponse.json({ ok: true, sent: 0 });

    const title = official ? "Offizieller Blaulicht-Post" : `Neue Meldung: ${category}`;
    const bodyText = [location, description].filter(Boolean).join(" · ").slice(0, 130) || "Neue Meldung im Blaulicht Report COC";

    const response = await admin.messaging.sendEachForMulticast({
      tokens,
      notification: {
        title,
        body: bodyText,
      },
      data: {
        reportId: body.reportId,
        url: "/",
      },
      webpush: {
        fcmOptions: {
          link: "/",
        },
        notification: {
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: `report-${body.reportId}`,
        },
      },
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((item, index) => {
      if (!item.success) {
        const code = item.error?.code || "";
        if (code.includes("registration-token-not-registered") || code.includes("invalid-registration-token")) {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    await Promise.all(
      invalidTokens.map((token) => admin.firestore.collection("pushTokens").doc(token).set({ active: false }, { merge: true }))
    );

    return NextResponse.json({ ok: true, sent: response.successCount, failed: response.failureCount });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Push konnte nicht gesendet werden." }, { status: 500 });
  }
}
