import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bank = searchParams.get("bank");
    const search = searchParams.get("search");

    const transactions = await prisma.transaction.findMany({
      where: {
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