import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getOrgId, resolveOrgId } from "@/lib/api-auth";

export async function GET(request: Request) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const { searchParams } = new URL(request.url);
    const bank = searchParams.get("bank");
    const search = searchParams.get("search");

    const transactions = await prisma.transaction.findMany({
      where: {
        ...(orgId ? { organisationId: orgId } : {}),
        ...(bank && bank !== "all" ? { bank } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { reference: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
