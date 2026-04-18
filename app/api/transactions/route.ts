import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getOrgId, resolveOrgId } from "@/lib/api-auth";

export async function GET(request: Request) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const { searchParams } = new URL(request.url);
    const bank     = searchParams.get("bank");
    const search   = searchParams.get("search");
    const page     = Math.max(1, parseInt(searchParams.get("page")     ?? "1",  10));
    const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10)));
    const skip     = (page - 1) * pageSize;

    const where = {
      ...(orgId ? { organisationId: orgId } : {}),
      ...(bank && bank !== "all" ? { bank } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { reference: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({ where, orderBy: { date: "desc" }, skip, take: pageSize }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
