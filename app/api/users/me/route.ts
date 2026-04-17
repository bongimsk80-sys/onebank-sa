import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

// GET /api/users/me — return the logged-in user's profile
export async function GET() {
  const session = await requireRole(["admin", "approver", "initiator", "reviewer", "executor", "viewer"]);
  if (session instanceof NextResponse) return session;

  const userId = (session.user as any).id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:        true,
      name:      true,
      email:     true,
      role:      true,
      organisation: { select: { name: true } },
      createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  return NextResponse.json({
    id:       user.id,
    name:     user.name,
    email:    user.email,
    role:     user.role,
    orgName:  user.organisation?.name ?? null,
    joinedAt: user.createdAt,
  });
}

// PATCH /api/users/me — update the logged-in user's display name
export async function PATCH(req: NextRequest) {
  const session = await requireRole(["admin", "approver", "initiator", "reviewer", "executor", "viewer"]);
  if (session instanceof NextResponse) return session;

  const userId = (session.user as any).id as string;
  const body   = await req.json().catch(() => ({}));
  const { name } = body ?? {};

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json(
      { error: "Name must be at least 2 characters." },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data:  { name: name.trim() },
    select: { name: true, email: true, role: true },
  });

  return NextResponse.json({ success: true, user: updated });
}
