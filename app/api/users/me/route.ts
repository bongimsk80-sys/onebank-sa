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

// PATCH /api/users/me — update name and/or email for the logged-in user
export async function PATCH(req: NextRequest) {
  const session = await requireRole(["admin", "approver", "initiator", "reviewer", "executor", "viewer"]);
  if (session instanceof NextResponse) return session;

  const userId = (session.user as any).id as string;
  const body   = await req.json().catch(() => ({}));
  const { name, email } = body ?? {};

  // At least one field must be provided
  if (!name && !email) {
    return NextResponse.json(
      { error: "Provide a name or email to update." },
      { status: 400 }
    );
  }

  const data: Record<string, string> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters." },
        { status: 400 }
      );
    }
    data.name = name.trim();
  }

  if (email !== undefined) {
    const trimmed = (email as string).trim().toLowerCase();
    // Basic format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }
    // Guard: email already in use by another account
    const conflict = await prisma.user.findFirst({
      where: { email: trimmed, NOT: { id: userId } },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "This email address is already registered to another account." },
        { status: 409 }
      );
    }
    data.email = trimmed;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { name: true, email: true, role: true },
  });

  return NextResponse.json({ success: true, user: updated, emailChanged: !!email });
}
