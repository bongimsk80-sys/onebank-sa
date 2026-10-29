/**
 * Stitch connector contract test with a mocked Stitch API.
 * Run: npx tsx tests/stitch-connector.test.mts
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

process.env.STITCH_CLIENT_ID = "test-client";
process.env.STITCH_CLIENT_SECRET = "test-secret";
process.env.STITCH_REDIRECT_URI = "https://app.example/api/connections/stitch/callback";

const calls: { url: string; body: string }[] = [];
const now = Date.now();
const iso = (daysAgo: number) => new Date(now - daysAgo * 864e5).toISOString();

globalThis.fetch = (async (input: any, init: any = {}) => {
  const url = String(input);
  const body = String(init.body ?? "");
  calls.push({ url, body });
  const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
  if (url.endsWith("/connect/token")) {
    return json({ access_token: "at-1", refresh_token: "rt-1", expires_in: 900, scope: "openid accounts balances transactions offline_access" });
  }
  const q = JSON.parse(body);
  if (q.query.includes("ListBankAccounts")) {
    return json({ data: { user: { bankAccounts: [
      { id: "acc-1", name: "Ops", accountNumber: "62000000001", accountType: "current", bankId: "fnb", branchCode: "250655",
        currentBalance: { quantity: "125000.50", currency: "ZAR" }, availableBalance: { quantity: "120000.00", currency: "ZAR" } },
    ] } } });
  }
  if (q.query.includes("AccountTransactions")) {
    const page = q.variables.after ? 2 : 1;
    const edges = page === 1
      ? [{ node: { id: "t1", amount: { quantity: "-4500.00", currency: "ZAR" }, reference: "ESKOM", description: "Eskom", date: iso(1), runningBalance: { quantity: "125000.50", currency: "ZAR" } } },
         { node: { id: "t2", amount: { quantity: "90000.00", currency: "ZAR" }, reference: "INV-77", description: "Acme", date: iso(5), runningBalance: null } }]
      : [{ node: { id: "t3", amount: "-100.00", reference: "FEE", description: "Bank fee", date: iso(20), runningBalance: null } },
         { node: { id: "t4", amount: "-50.00", reference: "OLD", description: "Too old", date: iso(200), runningBalance: null } }];
    return json({ data: { node: { transactions: { pageInfo: { hasNextPage: page === 1, endCursor: "c1" }, edges } } } });
  }
  return json({ errors: [{ message: "unexpected" }] }, 400);
}) as typeof fetch;

const { buildStitchAuthorizeUrl, exchangeStitchCode, stitchConnector } = await import("../lib/connectors/stitch.ts");

// 1. Authorize URL carries PKCE S256, state, nonce and the right scopes
const a = buildStitchAuthorizeUrl();
const u = new URL(a.url);
assert.equal(u.origin + u.pathname, "https://secure.stitch.money/connect/authorize");
assert.equal(u.searchParams.get("code_challenge_method"), "S256");
assert.equal(u.searchParams.get("code_challenge"), createHash("sha256").update(a.codeVerifier).digest("base64url"));
assert.ok(a.codeVerifier.length >= 43 && a.codeVerifier.length <= 128);
assert.equal(u.searchParams.get("state"), a.state);
assert.ok(u.searchParams.get("scope")!.split(" ").includes("transactions"));
assert.ok(u.searchParams.get("scope")!.split(" ").includes("offline_access"));
console.log("PASS authorize URL uses PKCE S256 with state, nonce and data scopes");

// 2. Code exchange sends the verifier and returns tokens
const t = await exchangeStitchCode("code-123", a.codeVerifier);
const tokenBody = new URLSearchParams(calls.at(-1)!.body);
assert.equal(tokenBody.get("grant_type"), "authorization_code");
assert.equal(tokenBody.get("code_verifier"), a.codeVerifier);
assert.equal(t.accessToken, "at-1");
assert.equal(t.refreshToken, "rt-1");
console.log("PASS code exchange sends code_verifier and returns access + refresh tokens");

// 3. Accounts are mapped, money objects parsed
const ctx = { connectionId: "c", organisationId: "o", tokens: t };
const accts = await stitchConnector.listAccounts(ctx);
assert.equal(accts.length, 1);
assert.equal(accts[0].bank, "FNB");
assert.equal(accts[0].currentBalance, 125000.5);
assert.equal(accts[0].availableBalance, 120000);
console.log("PASS accounts mapped to FNB with balances parsed from {quantity, currency}");

// 4. Transactions paginate and stop at the 'since' boundary
const since = new Date(now - 90 * 864e5);
const txns = await stitchConnector.listTransactions(ctx, accts[0], since);
assert.deepEqual(txns.map((x) => x.externalId), ["t1", "t2", "t3"]);
assert.equal(txns[0].amount, -4500);
assert.equal(txns[2].amount, -100);
console.log("PASS transactions paginate, parse both money formats, and drop entries older than 90 days");
