import { NextResponse } from "next/server";
import { chunk, getMessagingAdmin, getOrigin } from "@/lib/server/pushMessaging";

export const runtime = "nodejs";

type PushTokenDoc = { token?: string; uid?: string; active?: boolean; mentions?: boolean };

export async function POST(request: Request) {
  const admin = getMessagingAdmin();
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
      // Data-only payload, see report-created/route.ts for why (avoids double notifications).
      data: {
        title: "Du wurdest erwähnt",
        body: `${comment.authorName || "Jemand"}: ${String(comment.text || "").slice(0, 120)}`,
        reportId: body.reportId,
        commentId: body.commentId,
        url,
        tag: `mention-${body.commentId}`,
      },
      webpush: { fcmOptions: { link: absoluteUrl } },
    });

    return NextResponse.json({ ok: true, sent: response.successCount, failed: response.failureCount });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Push konnte nicht gesendet werden." }, { status: 500 });
  }
}
