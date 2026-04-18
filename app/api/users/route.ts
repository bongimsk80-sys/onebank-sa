import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, getOrgId, resolveOrgId } from "@/lib/api-auth";
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.string().min(1).max(50),
});

const UpdateUserSchema = z.object({
  id: z.string().min(1),
  role: z.string().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
});

const DeleteUserSchema = z.object({
  id: z.string().min(1),
});

export async function GET(request: Request) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const { searchParams } = new URL(request.url);
    const page     = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") ?? "100", 10)));
    const skip     = (page - 1) * pageSize;

    const isAdmin = (session.user as any).role === "admin";
    const where   = { ...(orgId ? { organisationId: orgId } : {}) };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          // Expose invite token to admins only so they can share the link manually
          ...(isAdmin ? { inviteToken: true } : {}),
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const body = await request.json();
    const result = CreateUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name:       data.name,
        email:      data.email,
        password:   hashedPassword,          // always store hashed
        role:       data.role,
        isActive:   true,
        isVerified: true,                    // admin-created — no email verification needed
        // Non-admin users join an existing org and skip onboarding.
        // Admin users added this way are co-admins who also skip onboarding
        // (the org is already configured by the original admin).
        hasCompletedOnboarding: true,
        ...(orgId ? { organisationId: orgId } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await prisma.notification.create({
      data: {
        title: "New User Added",
        message: `${data.name} has been added as ${data.role}.`,
        type: "info",
        link: "/settings/users",
        ...(orgId ? { organisationId: orgId } : {}),
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const body = await request.json();
    const result = UpdateUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    const user = await prisma.user.update({
      where: { id: data.id, ...(orgId ? { organisationId: orgId } : {}) },
      data: {
        ...(data.role ? { role: data.role } : {}),
        ...(typeof data.isActive === "boolean" ? { isActive: data.isActive } : {}),
        ...(data.name ? { name: data.name } : {}),
        // When manually activating a user, also mark them as verified and
        // clear any pending invite token so the "Invite Pending" badge disappears.
        ...(data.isActive === true ? { isVerified: true, inviteToken: null } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await requireRole(["admin"]);
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const body = await request.json();
    const result = DeleteUserSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: result.data.id, ...(orgId ? { organisationId: orgId } : {}) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
