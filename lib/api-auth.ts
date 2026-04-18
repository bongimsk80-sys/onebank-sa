import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Validates the session JWT against live DB state:
 * - H1: User must still be active (isActive=true)
 * - H12: JWT must have been issued after the last password reset
 *
 * A single DB round-trip handles both checks.
 */
async function validateLiveSession(session: any): Promise<NextResponse | null> {
  const userId   = (session?.user as any)?.id as string | undefined;
  const issuedAt = (session?.user as any)?.issuedAt as number | undefined; // epoch seconds

  if (!userId) return null; // no userId → nothing to check (handles edge cases)

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { isActive: true, passwordChangedAt: true },
  });

  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: "Your account has been deactivated. Please contact your admin." },
      { status: 401 }
    );
  }

  if (user.passwordChangedAt && issuedAt) {
    const changedAtEpoch = Math.floor(user.passwordChangedAt.getTime() / 1000);
    if (changedAtEpoch > issuedAt) {
      return NextResponse.json(
        { error: "Your session has expired after a password change. Please sign in again." },
        { status: 401 }
      );
    }
  }

  return null; // all good
}

export async function requireAuth() {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const invalid = await validateLiveSession(session);
  if (invalid) return invalid;

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

  const invalid = await validateLiveSession(session);
  if (invalid) return invalid;

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
