import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, getOrgId, resolveOrgId } from "@/lib/api-auth";
import { encrypt, decrypt } from "@/lib/encryption";
import { z } from "zod";

const CreateConnectionSchema = z.object({
  name: z.string().min(1).max(100),
  provider: z.string().min(1).max(50),
  apiKey: z.string().min(1).max(255),
  apiUrl: z.string().url(),
});

const UpdateConnectionSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1).max(30),
});

export async function GET() {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;
  const orgId = await resolveOrgId(session);

  try {
    const connections = await prisma.erpConnection.findMany({
      where: { ...(orgId ? { organisationId: orgId } : {}) },
      orderBy: { createdAt: "desc" },
    });

    // Mask the stored API key — never expose the raw (or encrypted) key to the client
    const safeConnections = connections.map((c) => ({
      ...c,
      apiKey: c.apiKey ? `${c.apiKey.slice(0, 4)}${"*".repeat(12)}` : null,
    }));

    return NextResponse.json({ connections: safeConnections });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch ERP connections" },
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
    const result = CreateConnectionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Encrypt the API key at rest — never store plaintext credentials
    const encryptedKey = process.env.ENCRYPTION_KEY
      ? encrypt(data.apiKey)
      : data.apiKey; // fallback: store as-is if key not configured (dev only)

    const connection = await prisma.erpConnection.create({
      data: {
        name:         data.name,
        provider:     data.provider,
        status:       "connected",
        apiKey:       encryptedKey,
        apiUrl:       data.apiUrl,
        lastSyncedAt: new Date(),
        ...(orgId ? { organisationId: orgId } : {}),
      },
    });

    // Return masked key, not the encrypted blob
    return NextResponse.json({
      connection: { ...connection, apiKey: `${data.apiKey.slice(0, 4)}${"*".repeat(12)}` }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create ERP connection" },
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
    const result = UpdateConnectionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const connection = await prisma.erpConnection.update({
      where: { id: data.id, ...(orgId ? { organisationId: orgId } : {}) },
      data: {
        status: data.status,
        lastSyncedAt: data.status === "connected" ? new Date() : undefined,
      },
    });
    return NextResponse.json({ connection });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update ERP connection" },
      { status: 500 }
    );
  }
}
