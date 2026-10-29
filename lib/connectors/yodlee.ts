import type { BankConnector, ConnectorContext, ExternalAccount, ExternalTransaction, ProviderTokens } from "./types";
import { requireEnv } from "./types";

/**
 * Yodlee — adapter for the Yodlee Core API (v1.1) with FastLink for linking.
 *
 * STATUS: disabled by default. Yodlee's published coverage is the US, Canada,
 * UK/Europe, Australia and India; we found no current South African bank
 * coverage, and its historic SA access (via 22seven, 2012–2013) used customer
 * banking credentials, which SA banks say breaches their online-banking terms.
 * Enable only after Yodlee confirms in writing which SA business-banking
 * institutions it supports and by what access method.
 *
 * Flow:
 *   1. Server obtains a user token (POST /auth/token with loginName = our
 *      connection id) and hands it to the FastLink widget in the browser.
 *   2. The customer links accounts inside FastLink.
 *   3. Server lists /accounts and /transactions with the same user token.
 *
 * Required env: YODLEE_ENABLED=true, YODLEE_BASE_URL, YODLEE_CLIENT_ID,
 *               YODLEE_CLIENT_SECRET, YODLEE_FASTLINK_URL
 */

export function yodleeConfigured(): boolean {
  return (
    process.env.YODLEE_ENABLED === "true" &&
    Boolean(process.env.YODLEE_BASE_URL && process.env.YODLEE_CLIENT_ID && process.env.YODLEE_CLIENT_SECRET)
  );
}

function env() {
  if (process.env.YODLEE_ENABLED !== "true") {
    throw new Error("Yodlee is disabled. Set YODLEE_ENABLED=true once South African coverage is confirmed.");
  }
  return requireEnv("yodlee", ["YODLEE_BASE_URL", "YODLEE_CLIENT_ID", "YODLEE_CLIENT_SECRET"]);
}

/** loginName is our own identifier for the Yodlee user — the connection id. */
export async function yodleeUserToken(loginName: string): Promise<ProviderTokens> {
  const e = env();
  const res = await fetch(`${e.YODLEE_BASE_URL}/auth/token`, {
    method: "POST",
    headers: { "Api-Version": "1.1", loginName, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ clientId: e.YODLEE_CLIENT_ID, secret: e.YODLEE_CLIENT_SECRET }).toString(),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  const t = json?.token;
  if (!res.ok || !t?.accessToken) throw new Error(`Yodlee token request failed (${res.status})`);
  return {
    accessToken: t.accessToken,
    expiresAt: new Date(Date.now() + (Number(t.expiresIn ?? 1800) - 30) * 1000),
    externalUserId: loginName,
  };
}

async function api<T>(accessToken: string, path: string): Promise<T> {
  const e = env();
  const res = await fetch(`${e.YODLEE_BASE_URL}${path}`, {
    headers: { "Api-Version": "1.1", Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Yodlee ${path} failed (${res.status})`);
  return res.json() as Promise<T>;
}

export const yodleeConnector: BankConnector = {
  id: "yodlee",
  displayName: "Yodlee",

  async refresh(ctx: ConnectorContext) {
    // Yodlee user tokens are short-lived and re-issued from client credentials.
    if (ctx.tokens?.expiresAt && ctx.tokens.expiresAt.getTime() > Date.now() + 60_000) return null;
    return yodleeUserToken(ctx.tokens?.externalUserId ?? ctx.connectionId);
  },

  async listAccounts(ctx) {
    const data = await api<{ account?: any[] }>(ctx.tokens!.accessToken, "/accounts?status=ACTIVE");
    return (data.account ?? [])
      .filter((a) => a.CONTAINER === "bank")
      .map((a): ExternalAccount => ({
        externalId: String(a.id),
        bank: a.providerName ?? "Unknown bank",
        accountNumber: a.accountNumber ?? a.displayedName ?? String(a.id),
        accountType: a.accountType ?? "Current",
        name: a.accountName,
        currency: a.currentBalance?.currency ?? a.balance?.currency ?? "ZAR",
        currentBalance: Number(a.currentBalance?.amount ?? a.balance?.amount ?? 0),
        availableBalance: a.availableBalance ? Number(a.availableBalance.amount) : null,
      }));
  },

  async listTransactions(ctx, account, since) {
    const out: ExternalTransaction[] = [];
    const fromDate = since.toISOString().slice(0, 10);
    for (let skip = 0; skip < 5000; skip += 500) {
      const data = await api<{ transaction?: any[] }>(
        ctx.tokens!.accessToken,
        `/transactions?accountId=${encodeURIComponent(account.externalId)}&fromDate=${fromDate}&top=500&skip=${skip}`
      );
      const rows = data.transaction ?? [];
      for (const t of rows) {
        const amt = Number(t.amount?.amount ?? 0);
        out.push({
          externalId: String(t.id),
          date: new Date(t.postDate ?? t.transactionDate ?? t.date),
          amount: t.baseType === "DEBIT" ? -Math.abs(amt) : Math.abs(amt),
          description: t.description?.simple ?? t.description?.original ?? "",
          reference: t.checkNumber ?? t.id?.toString() ?? "",
          runningBalance: t.runningBalance ? Number(t.runningBalance.amount) : null,
        });
      }
      if (rows.length < 500) break;
    }
    return out;
  },
};
