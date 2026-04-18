import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getOrgId, resolveOrgId } from "@/lib/api-auth";
import { z } from "zod";

const CreateActivityLogSchema = z.object({
  action: z.string().min(1).max(150),
  description: z.string().min(1).max(1000),
  userId: z.string().optional(),
  userName: z.string().optional(),
  entityType: z.string().min(1).max(50),
  entityId: z.string().optional(),
  ipAddress: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const { searchParams } = new URL(request.url);
    const search     = searchParams.get("search");
    const status     = searchParams.get("status");
    const entityType = searchParams.get("entityType");
    const page       = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10));
    const pageSize   = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10)));
    const skip       = (page - 1) * pageSize;

    const where = {
      ...(orgId ? { organisationId: orgId } : {}),
      ...(search
        ? {
            OR: [
              { action:      { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { userName:    { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
      ...(status     && status     !== "all" ? { status }     : {}),
      ...(entityType && entityType !== "all" ? { entityType } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: pageSize }),
      prisma.activityLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const body = await request.json();
    const result = CreateActivityLogSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const log = await prisma.activityLog.create({
      data: {
        action: data.action,
        description: data.description,
        userId: data.userId,
        userName: data.userName,
        entityType: data.entityType,
        entityId: data.entityId,
        ipAddress: data.ipAddress ?? "127.0.0.1",
        status: data.status ?? "success",
        ...(orgId ? { organisationId: orgId } : {}),
      },
    });
    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create activity log" },
      { status: 500 }
    );
  }
}
