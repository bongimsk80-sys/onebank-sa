import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateNotificationSchema = z.object({
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(500),
  type: z.string().min(1).max(20).optional(),
  userId: z.string().optional(),
  link: z.string().optional(),
});

const PatchNotificationSchema = z
  .object({
    id: z.string().min(1).optional(),
    markAllRead: z.boolean().optional(),
  })
  .refine((data) => data.markAllRead === true || !!data.id, {
    message: "Provide id or markAllRead=true",
  });

const DeleteNotificationSchema = z.object({
  id: z.string().min(1),
});

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ notifications });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = CreateNotificationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type ?? "info",
        userId: data.userId,
        link: data.link,
      },
    });
    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const result = PatchNotificationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    if (data.markAllRead) {
      await prisma.notification.updateMany({
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    const notification = await prisma.notification.update({
      where: { id: data.id },
      data: { read: true },
    });
    return NextResponse.json({ notification });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const result = DeleteNotificationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    await prisma.notification.delete({
      where: { id: result.data.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}