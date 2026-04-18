"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSessionStore } from "@/store/session-store";

export default function SessionInitializer() {
  const { data: session, status } = useSession();
  const setSession  = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const user = session.user as any;

      const role    = user.role    || null;
      const name    = user.name    || "";
      const email   = user.email   || "";
      const orgName = user.orgName || null;

      // If the session is missing name, email, or role (can happen when a
      // stale JWT pre-dates the auth.ts fixes), fetch fresh data from the
      // profile API as a fallback.
      if (!name || !email || !role) {
        fetch("/api/users/me")
          .then((r) => r.ok ? r.json() : null)
          .then((data) => {
            if (data?.name || data?.email || data?.role) {
              setSession(
                data.role  || role || "viewer",
                data.name  || name,
                data.email || email,
                data.orgName || orgName || null
              );
            } else {
              setSession(role || "viewer", name, email, orgName);
            }
          })
          .catch(() => setSession(role || "viewer", name, email, orgName));
        return;
      }

      setSession(role, name, email, orgName);

    } else if (status === "unauthenticated") {
      clearSession();
    }
  }, [session, status, setSession, clearSession]);

  return null;
}
