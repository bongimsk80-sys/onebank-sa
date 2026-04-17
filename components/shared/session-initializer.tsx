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

      // If the session is missing name/email (can happen when token is
      // refreshed and fields aren't explicitly re-populated), fetch fresh
      // data from the profile API as a fallback.
      if (!name || !email) {
        fetch("/api/users/me")
          .then((r) => r.ok ? r.json() : null)
          .then((data) => {
            if (data?.name || data?.email) {
              setSession(
                role || data.role || "viewer",
                data.name  || name,
                data.email || email,
                orgName || data.orgName || null
              );
            } else {
              setSession(role || "viewer", name, email, orgName);
            }
          })
          .catch(() => setSession(role || "viewer", name, email, orgName));
        return;
      }

      setSession(role || "viewer", name, email, orgName);

    } else if (status === "unauthenticated") {
      clearSession();
    }
  }, [session, status, setSession, clearSession]);

  return null;
}
