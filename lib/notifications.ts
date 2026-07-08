import { addDoc, collection, getDocs, limit, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/app/firebase";
import type { AppUser } from "@/lib/types";

export type AppNotificationType = "mention" | "admin" | "system" | "reply";

export async function createMentionNotifications({
  mentions,
  actorId,
  actorName,
  text,
  reportId,
  source,
}: {
  mentions: string[];
  actorId: string;
  actorName: string;
  text: string;
  reportId: string;
  source: "report" | "comment";
}) {
  const uniqueMentions = [...new Set(mentions)].filter(Boolean).slice(0, 10);
  if (!uniqueMentions.length) return;

  await Promise.all(
    uniqueMentions.map(async (username) => {
      const usersSnap = await getDocs(
        query(collection(db, "users"), where("username", "==", username), limit(1)),
      );
      const target = usersSnap.docs[0]?.data() as AppUser | undefined;
      if (!target || target.uid === actorId) return;

      await addDoc(collection(db, "notifications"), {
        userId: target.uid,
        type: "mention" satisfies AppNotificationType,
        title: "Du wurdest erwähnt",
        body: `${actorName}: ${text.slice(0, 140)}`,
        reportId,
        source,
        actorId,
        actorName,
        read: false,
        createdAt: serverTimestamp(),
      });
    }),
  );
}
