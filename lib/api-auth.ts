import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

/**
 * Returns the organisationId from the session, or null for legacy/seed
 * users who have no organisation yet.
 *
 * Use in where clauses:
 *   const orgId = getOrgId(session);
 *   where: { ...(orgId ? { organisationId: orgId } : {}), ...otherFilters }
 */
export function getOrgId(session: any): string | null {
  return (session?.user as any)?.organisationId ?? null;
}

/**
 * Like getOrgId but returns a 403 NextResponse when orgId is missing.
 * Use for routes that must be strictly org-scoped.
 *
 *   const orgId = requireOrgId(session);
 *   if (orgId instanceof NextResponse) return orgId;
 */
export function requireOrgId(session: any): string | NextResponse {
  const orgId = getOrgId(session);
  if (!orgId) {
    return NextResponse.json(
      { error: "No organisation associated with your account." },
      { status: 403 }
    );
  }
  return orgId;
}

/**
 * Resolves the organisationId for the current user.
 *
 * JWT-first: reads from the session token (fast, no DB).
 * Falls back to a single DB lookup when the token is stale/missing the field
 * (e.g. users with JWTs issued before the auth.ts organisationId fix).
 *
 * This ensures every user always sees their org's data — never a cross-org
 * leak or empty result due to a missing JWT claim.
 *
 *   const orgId = await resolveOrgId(session);
 *   where: { ...(orgId ? { organisationId: orgId } : {}), ...otherFilters }
 */
export async function resolveOrgId(session: any): Promise<string | null> {
  const fromToken = getOrgId(session);
  if (fromToken) return fromToken;

  // Token is stale — look up from DB using the user id stored in the token.
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organisationId: true },
  });
  return user?.organisationId ?? null;
}
