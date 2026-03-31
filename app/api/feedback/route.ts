import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const feedback = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("Failed to fetch feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Strict rating validation
    if (
      typeof body.rating !== "number" ||
      body.rating < 1 ||
      body.rating > 5
    ) {
      return NextResponse.json(
        { error: "A valid rating between 1 and 5 is required" },
        { status: 400 }
      );
    }

    // Input length limits
    const message = body.message
      ? String(body.message).substring(0, 1000)
      : null;
    const page = body.page
      ? String(body.page).substring(0, 200)
      : null;

    // Safe session user access
    const user = session.user as {
      name?: string;
      role?: string;
    };

    const feedback = await prisma.feedback.create({
      data: {
        rating: body.rating,
        categories: JSON.stringify(body.categories ?? []),
        message,
        page,
        userName: user?.name ?? "Anonymous",
        userRole: user?.role ?? "unknown",
      },
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
