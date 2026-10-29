import { prisma } from "@/lib/prisma";
import { seal, open, sha256Hex } from "@/lib/secure-crypto";
import { getConnector } from "./index";
import type { ConnectorContext, ExternalTransaction, ProviderTokens } from "./types";

const BANK_COLORS: Record<string, string> = {
  FNB: "#006B3C",
  "Standard Bank": "#0033A0",
  Absa: "#DC0032",
  Nedbank: "#007B40",
  Capitec: "#007DC5",
  Investec: "#1E2D3B",
};

const FIRST_SYNC_DAYS = 90; // Stitch documents up to three months of history
const OVERLAP_DAYS = 3;     // re-read a few days each sync; the dedupe hash absorbs overlap

export function transactionHash(accountId: string, t: ExternalTransaction): string {
  if (t.externalId) return sha256Hex(`ext|${accountId}|${t.externalId}`);
  return sha256Hex(
    [accountId, t.date.toISOString().slice(0, 10), t.amount.toFixed(2), t.reference.trim(), t.description.trim()].join("|")
  );
}

export function storeTokens(tokens: ProviderTokens) {
  return {
    accessTokenEnc: seal(tokens.accessToken),
    refreshTokenEnc: tokens.refreshToken ? seal(tokens.refreshToken) : null,
    tokenExpiresAt: tokens.expiresAt ?? null,
    scopes: tokens.scopes ?? null,
    ...(tokens.externalUserId ? { externalUserId: tokens.externalUserId } : {}),
  };
}

export async function syncConnection(connectionId: string, organisationId: string, actor?: { id: string; name: string }) {
  const conn = await prisma.bankConnection.findFirst({ where: { id: connectionId, organisationId } });
  if (!conn) throw new Error("Connection not found");
  if (conn.status === "revoked") throw new Error("Connection has been revoked");
  if (conn.consentExpiresAt && conn.consentExpiresAt < new Date()) {
    await prisma.bankConnection.update({ where: { id: conn.id }, data: { status: "error", lastError: "Consent expired — reconnect the bank." } });
    throw new Error("Consent expired — reconnect the bank.");
  }

  const connector = getConnector(conn.provider);
  const ctx: ConnectorContext = {
    connectionId: conn.id,
    organisationId,
    label: conn.label,
    tokens: conn.accessTokenEnc
      ? {
          accessToken: open(conn.accessTokenEnc),
          refreshToken: conn.refreshTokenEnc ? open(conn.refreshTokenEnc) : null,
          expiresAt: conn.tokenExpiresAt,
          scopes: conn.scopes,
          externalUserId: conn.externalUserId,
        }
      : null,
  };

  try {
    if (connector.refresh) {
      const fresh = await connector.refresh(ctx);
      if (fresh) {
        ctx.tokens = { ...ctx.tokens, ...fresh } as ProviderTokens;
        await prisma.bankConnection.update({ where: { id: conn.id }, data: storeTokens(ctx.tokens) });
      }
    }

    const since = conn.lastSyncedAt
      ? new Date(conn.lastSyncedAt.getTime() - OVERLAP_DAYS * 864e5)
      : new Date(Date.now() - FIRST_SYNC_DAYS * 864e5);

    const accounts = await connector.listAccounts(ctx);
    let inserted = 0;

    for (const ext of accounts) {
      const now = new Date();
      const account = await prisma.bankAccount.upsert({
        where: { connectionId_externalId: { connectionId: conn.id, externalId: ext.externalId } },
        create: {
          bank: ext.bank,
          accountNumber: ext.accountNumber,
          accountType: ext.accountType,
          balance: ext.currentBalance,
          availableBalance: ext.availableBalance ?? null,
          currency: ext.currency,
          color: BANK_COLORS[ext.bank] ?? "#1B4332",
          source: conn.provider,
          externalId: ext.externalId,
          lastSyncedAt: now,
          connectionId: conn.id,
          organisationId,
        },
        update: {
          balance: ext.currentBalance,
          availableBalance: ext.availableBalance ?? null,
          accountType: ext.accountType,
          lastSyncedAt: now,
          isActive: true,
        },
      });

      const txns = await connector.listTransactions(ctx, ext, since);
      if (txns.length) {
        const res = await prisma.transaction.createMany({
          data: txns.map((t) => ({
            name: t.description || t.reference || "Bank transaction",
            type: t.amount >= 0 ? "credit" : "debit",
            amount: t.amount,
            date: t.date,
            bank: ext.bank,
            accountNumber: ext.accountNumber,
            reference: t.reference || "",
            status: "completed",
            source: conn.provider,
            externalId: t.externalId ?? null,
            dedupeHash: transactionHash(account.id, t),
            bankAccountId: account.id,
            organisationId,
          })),
          skipDuplicates: true,
        });
        inserted += res.count;
      }
    }

    await prisma.bankConnection.update({
      where: { id: conn.id },
      data: { status: "active", lastSyncedAt: new Date(), lastError: null },
    });

    await prisma.activityLog.create({
      data: {
        action: "Bank Sync",
        description: `${connector.displayName}: ${accounts.length} account(s), ${inserted} new transaction(s)`,
        userId: actor?.id,
        userName: actor?.name ?? "system",
        entityType: "bank_connection",
        entityId: conn.id,
        organisationId,
      },
    });

    return { accounts: accounts.length, inserted };
  } catch (err: any) {
    const message = err?.message === "STITCH_UNAUTHORIZED" ? "Bank authorisation expired — reconnect the bank." : String(err?.message ?? err);
    await prisma.bankConnection.update({ where: { id: conn.id }, data: { status: "error", lastError: message.slice(0, 500) } });
    throw new Error(message);
  }
}
