"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSessionStore } from "@/store/session-store";

export default function SessionInitializer() {
  const { data: session, status } = useSession();
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const user = session.user as any;
      setSession(
        user.role,
        user.name ?? "",
        user.email ?? ""
      );
    } else if (status === "unauthenticated") {
      clearSession();
    }
  }, [session, status, setSession, clearSession]);

  return null;
}