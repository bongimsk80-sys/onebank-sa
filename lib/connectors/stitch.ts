import { createHash } from "crypto";
import type { BankConnector, ConnectorContext, ExternalAccount, ExternalTransaction, ProviderTokens } from "./types";
import { requireEnv } from "./types";
import { randomToken } from "@/lib/secure-crypto";

/**
 * Stitch (South Africa) — user-permissioned financial data.
 *
 * Flow (docs.stitch.money/authentication/user-tokens):
 *   1. Redirect the customer to secure.stitch.money/connect/authorize with
 *      PKCE (S256), state and nonce; scopes openid offline_access accounts
 *      balances transactions accountholders.
 *   2. Stitch redirects back with ?code&state → exchange at /connect/token.
 *   3. Call https://api.stitch.money/graphql with the user access token
 *      (expires after ~15 min); refresh with the refresh token on 401.
 *
 * Stitch documents up to three months of historical transactions and real-time
 * balances. Field names below follow Stitch's published examples; confirm them
 * against the live schema in your Stitch test client (ide.stitch.money)
 * before going live — that is a contract-stage check, not a code change.
 *
 * Required env: STITCH_CLIENT_ID, STITCH_CLIENT_SECRET, STITCH_REDIRECT_URI
 */

const AUTHORIZE_URL = "https://secure.stitch.money/connect/authorize";
const TOKEN_URL = "https://secure.stitch.money/connect/token";
const GRAPHQL_URL = "https://api.stitch.money/graphql";
export const STITCH_SCOPES = "openid offline_access accounts balances transactions accountholders";

const BANK_NAMES: Record<string, string> = {
  absa: "Absa",
  capitec: "Capitec",
  fnb: "FNB",
  investec: "Investec",
  nedbank: "Nedbank",
  standard_bank: "Standard Bank",
  tymebank: "TymeBank",
  discovery_bank: "Discovery Bank",
};

function env() {
  return requireEnv("stitch", ["STITCH_CLIENT_ID", "STITCH_CLIENT_SECRET", "STITCH_REDIRECT_URI"]);
}

export function stitchConfigured(): boolean {
  return Boolean(process.env.STITCH_CLIENT_ID && process.env.STITCH_CLIENT_SECRET && process.env.STITCH_REDIRECT_URI);
}

/** Builds the authorize URL plus the secrets the caller must store server-side. */
export function buildStitchAuthorizeUrl() {
  const e = env();
  const codeVerifier = randomToken(48); // 64 base64url chars, within 43–128
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  const state = randomToken(32);
  const nonce = randomToken(32);
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", e.STITCH_CLIENT_ID);
  url.searchParams.set("scope", STITCH_SCOPES);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", e.STITCH_REDIRECT_URI);
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return { url: url.toString(), state, nonce, codeVerifier };
}

async function tokenRequest(body: Record<string, string>): Promise<ProviderTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(`Stitch token request failed (${res.status}): ${json.error ?? "unknown error"}`);
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresAt: new Date(Date.now() + (Number(json.expires_in ?? 900) - 30) * 1000),
    scopes: json.scope ?? null,
  };
}

export async function exchangeStitchCode(code: string, codeVerifier: string) {
  const e = env();
  return tokenRequest({
    grant_type: "authorization_code",
    client_id: e.STITCH_CLIENT_ID,
    client_secret: e.STITCH_CLIENT_SECRET,
    redirect_uri: e.STITCH_REDIRECT_URI,
    code,
    code_verifier: codeVerifier,
  });
}

async function refreshTokens(refreshToken: string) {
  const e = env();
  return tokenRequest({
    grant_type: "refresh_token",
    client_id: e.STITCH_CLIENT_ID,
    client_secret: e.STITCH_CLIENT_SECRET,
    refresh_token: refreshToken,
  });
}

async function gql<T>(accessToken: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("STITCH_UNAUTHORIZED");
  const json = await res.json();
  if (json.errors?.length) throw new Error(`Stitch GraphQL error: ${json.errors.map((x: any) => x.message).join("; ")}`);
  return json.data as T;
}

/** Stitch money values may arrive as a number, a string, or { quantity, currency }. */
function money(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number.parseFloat(v);
  if (typeof v === "object" && "quantity" in (v as any)) return Number.parseFloat((v as any).quantity);
  return 0;
}

const ACCOUNTS_QUERY = `
query ListBankAccounts {
  user {
    bankAccounts {
      id
      name
      accountNumber
      accountType
      bankId
      branchCode
      currentBalance
      availableBalance
    }
  }
}`;

const TRANSACTIONS_QUERY = `
query AccountTransactions($accountId: ID!, $first: UInt, $after: Cursor) {
  node(id: $accountId) {
    ... on BankAccount {
      transactions(first: $first, after: $after) {
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            id
            amount
            reference
            description
            date
            runningBalance
          }
        }
      }
    }
  }
}`;

function token(ctx: ConnectorContext): string {
  if (!ctx.tokens?.accessToken) throw new Error("Stitch connection has no access token — reconnect the bank.");
  return ctx.tokens.accessToken;
}

export const stitchConnector: BankConnector = {
  id: "stitch",
  displayName: "Stitch",

  async refresh(ctx) {
    const t = ctx.tokens;
    if (!t?.refreshToken) return null;
    if (t.expiresAt && t.expiresAt.getTime() > Date.now() + 60_000) return null;
    return refreshTokens(t.refreshToken);
  },

  async listAccounts(ctx) {
    const data = await gql<{ user: { bankAccounts: any[] } }>(token(ctx), ACCOUNTS_QUERY);
    return (data.user?.bankAccounts ?? []).map((a): ExternalAccount => ({
      externalId: a.id,
      bank: BANK_NAMES[a.bankId] ?? a.bankId ?? "Unknown bank",
      accountNumber: a.accountNumber,
      accountType: a.accountType ?? "Current",
      name: a.name,
      currency: (a.currentBalance as any)?.currency ?? "ZAR",
      currentBalance: money(a.currentBalance),
      availableBalance: a.availableBalance == null ? null : money(a.availableBalance),
    }));
  },

  async listTransactions(ctx, account, since) {
    const out: ExternalTransaction[] = [];
    let after: string | null = null;
    for (let page = 0; page < 50; page++) {
      const data: any = await gql(token(ctx), TRANSACTIONS_QUERY, { accountId: account.externalId, first: 100, after });
      const conn = data?.node?.transactions;
      if (!conn) break;
      let reachedOld = false;
      for (const { node } of conn.edges ?? []) {
        const date = new Date(node.date);
        if (date < since) { reachedOld = true; continue; }
        out.push({
          externalId: node.id,
          date,
          amount: money(node.amount),
          description: node.description ?? "",
          reference: node.reference ?? "",
          runningBalance: node.runningBalance == null ? null : money(node.runningBalance),
        });
      }
      if (reachedOld || !conn.pageInfo?.hasNextPage) break;
      after = conn.pageInfo.endCursor;
    }
    return out;
  },
};
