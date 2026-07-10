import { NextResponse } from "next/server";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { chunk, getMessagingAdmin, getOrigin } from "@/lib/server/pushMessaging";

export const runtime = "nodejs";

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

export async function POST(request: Request) {
  const admin = getMessagingAdmin();
  if (!admin) return NextResponse.json({ ok: false, disabled: true, message: "FIREBASE_SERVICE_ACCOUNT_KEY fehlt." });

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

    const allTokenDocs: QueryDocumentSnapshot[] = [];
    let cursor: QueryDocumentSnapshot | null = null;
    const PAGE_SIZE = 1000;
    const MAX_TOKENS = 20_000; // safety ceiling, far above realistic scale — guards against a runaway loop, not a real limit

    while (allTokenDocs.length < MAX_TOKENS) {
      let pageQuery = admin.firestore.collection("pushTokens").where("active", "==", true).orderBy("__name__").limit(PAGE_SIZE);
      if (cursor) pageQuery = pageQuery.startAfter(cursor);
      const pageSnap = await pageQuery.get();
      if (pageSnap.empty) break;
      allTokenDocs.push(...pageSnap.docs);
      cursor = pageSnap.docs[pageSnap.docs.length - 1];
      if (pageSnap.size < PAGE_SIZE) break;
    }

    const tokens = allTokenDocs
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
        // Data-only payload: the service worker's onBackgroundMessage builds and
        // shows the notification itself. Sending a top-level `notification` field
        // here as well causes the browser to auto-display it AND the service
        // worker to show it again, i.e. every push arrives twice.
        data: { title, body: bodyText, reportId: body.reportId, url, tag: `report-${body.reportId}` },
        webpush: {
          fcmOptions: { link: absoluteUrl },
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
