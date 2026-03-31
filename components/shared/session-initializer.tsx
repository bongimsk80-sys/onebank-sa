"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { rolePermissions, useSessionStore } from "@/store/session-store";

export default function SessionInitializer() {
  const { data: session } = useSession();
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clearSession);

  useEffect(() => {
    if (session?.user) {
      setSession(
        (session.user as any).role,
        session.user.name ?? "",
        session.user.email ?? ""
      );
    } else {
      clearSession();
    }
  }, [session, setSession, clearSession]);

  return null;
}