"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/app/firebase";
import { useAuth } from "@/app/context/AuthContext";

/**
 * Live counts for the bottom-navigation badges:
 * - openForStaff: tickets with status "open" that an admin/developer still needs
 *   to answer (developers see all targets, admins only "admin"-targeted tickets).
 * - answeredForUser: the current user's own tickets that staff has answered
 *   ("answered" status), i.e. waiting on the user to read/reply.
 *
 * Both counts are 0 while signed out, and each subscription only runs for the
 * role it applies to (a normal user never subscribes to the staff query).
 */
export function useSupportBadgeCounts() {
  const { user, userData } = useAuth();
  const [openForStaff, setOpenForStaff] = useState(0);
  const [answeredForUser, setAnsweredForUser] = useState(0);

  const isStaff = userData?.role === "admin" || userData?.role === "developer";

  useEffect(() => {
    if (!isStaff || !userData) {
      setOpenForStaff(0);
      return;
    }

    const staffQuery =
      userData.role === "developer"
        ? query(collection(db, "supportTickets"), where("status", "==", "open"))
        : query(collection(db, "supportTickets"), where("target", "==", "admin"), where("status", "==", "open"));

    const unsub = onSnapshot(staffQuery, (snap) => setOpenForStaff(snap.size), () => setOpenForStaff(0));
    return () => unsub();
  }, [isStaff, userData?.role]);

  useEffect(() => {
    if (!user) {
      setAnsweredForUser(0);
      return;
    }

    const userQuery = query(collection(db, "supportTickets"), where("createdBy", "==", user.uid), where("status", "==", "answered"));
    const unsub = onSnapshot(userQuery, (snap) => setAnsweredForUser(snap.size), () => setAnsweredForUser(0));
    return () => unsub();
  }, [user?.uid]);

  return { openForStaff, answeredForUser };
}
