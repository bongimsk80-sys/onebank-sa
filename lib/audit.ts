import { prisma, auditHash } from "@/lib/prisma";

/**
 * Walks an organisation's audit chain oldest → newest and reports the first
 * entry whose hash does not match. Entries written before chaining existed
 * (hash = null) are skipped.
 */
export async function verifyAuditChain(organisationId: string) {
  const rows = await prisma.activityLog.findMany({
    where: { organisationId, hash: { not: null } },
    orderBy: { createdAt: "asc" },
  });

  let prev: string | null = null;
  for (const row of rows) {
    const expected = auditHash(prev, row as unknown as Record<string, unknown>);
    if (row.prevHash !== prev || row.hash !== expected) {
      return { ok: false as const, checked: rows.length, brokenAt: row.id, at: row.createdAt };
    }
    prev = row.hash;
  }
  return { ok: true as const, checked: rows.length };
}
