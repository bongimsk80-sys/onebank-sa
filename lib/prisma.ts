import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

/**
 * Prisma client with one extension: every ActivityLog row is hash-chained per
 * organisation (prevHash → hash), so edits or deletions in the audit trail are
 * detectable with `verifyAuditChain()` in lib/audit.ts.
 *
 * The chain is computed inside a transaction with an advisory lock per
 * organisation so concurrent writes cannot fork it.
 */
function canonical(e: Record<string, unknown>): string {
  return JSON.stringify([
    e.organisationId ?? null,
    e.action ?? null,
    e.description ?? null,
    e.userId ?? null,
    e.userName ?? null,
    e.entityType ?? null,
    e.entityId ?? null,
    e.ipAddress ?? null,
    e.status ?? "success",
    e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt ?? null,
  ]);
}

export function auditHash(prevHash: string | null, entry: Record<string, unknown>): string {
  return createHash("sha256").update((prevHash ?? "GENESIS") + "|" + canonical(entry)).digest("hex");
}

function makeClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
  });

  return base.$extends({
    query: {
      activityLog: {
        async create({ args }) {
          const data = args.data as Record<string, unknown>;
          const orgId = (data.organisationId as string | undefined) ?? null;
          return base.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"audit:" + (orgId ?? "platform")}))`;
            const prev = await tx.activityLog.findFirst({
              where: { organisationId: orgId, hash: { not: null } },
              orderBy: { createdAt: "desc" },
              select: { hash: true },
            });
            const createdAt = new Date();
            const prevHash = prev?.hash ?? null;
            const hash = auditHash(prevHash, { ...data, createdAt });
            return tx.activityLog.create({ ...args, data: { ...(args.data as object), createdAt, prevHash, hash } as any });
          });
        },
        async createMany({ args, query }) {
          // Bulk inserts are only used by the seed script; they are not chained.
          return query(args);
        },
        async update() {
          throw new Error("Audit log entries are append-only.");
        },
        async updateMany() {
          throw new Error("Audit log entries are append-only.");
        },
      },
    },
  });
}

type ExtendedClient = ReturnType<typeof makeClient>;

const globalForPrisma = globalThis as unknown as { prisma: ExtendedClient | undefined };

export const prisma: ExtendedClient = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
