import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  return session;
}

export async function requireRole(allowedRoles: string[]) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  if (!allowedRoles.includes((session.user as any).role)) {
    return NextResponse.json(
      { error: "Forbidden — insufficient permissions" },
      { status: 403 }
    );
  }
  return session;
}
