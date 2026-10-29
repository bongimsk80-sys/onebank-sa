# OneView — multi-bank treasury console for South Africa

OneView gives a finance team one view of balances and transactions across its South African banks, with maker-checker payment approvals, transfer limits and a tamper-evident audit trail. During the beta, payment execution is simulated: no money moves.

## Stack

Next.js 16 (App Router) · TypeScript · Prisma 5 + PostgreSQL (Neon) · NextAuth v5 (credentials + TOTP) · Tailwind 4 · Vercel.

## Run locally

```bash
cp .env.example .env.local      # fill in DATABASE_URL, AUTH_SECRET, ENCRYPTION_KEY
npm ci
npx prisma migrate deploy
npm run db:seed                 # demo organisation, users and data (refuses to run in production)
npm run dev
```

Set `REQUIRE_MFA=false` locally if you do not want to enrol an authenticator for the seeded admin.

## Bank data

All bank sources implement one interface, `lib/connectors/types.ts → BankConnector`. The sync engine (`lib/connectors/sync.ts`) is the only caller: it refreshes tokens, upserts accounts, de-duplicates transactions with a hash and writes an audit entry.

| Provider | File | Status |
| --- | --- | --- |
| Stitch | `lib/connectors/stitch.ts` | OAuth 2.0 + PKCE consent at Stitch, then GraphQL for accounts, balances and transactions (up to 3 months). Needs `STITCH_*` credentials from Stitch; confirm field names against your Stitch test client before go-live. |
| Yodlee | `lib/connectors/yodlee.ts` | Core API v1.1 + FastLink. **Disabled** (`YODLEE_ENABLED=false`) until Yodlee confirms South African business-banking coverage in writing. |
| Demo data | `lib/connectors/simulated.ts` | Deterministic simulated SA bank data for demos. |

Connect banks in **Settings → Bank Accounts → Connect a bank**. Each connection records who consented, when, and for how long (90 days); revoking consent wipes stored tokens and hides the accounts while keeping history for the audit trail.

## Security model

- **Tenant isolation:** every API route requires an organisation and filters by it; a user without an organisation gets 403.
- **Two-factor authentication:** TOTP for all users; mandatory for admin, approver and executor before any privileged change (`requireMfa` in `lib/api-auth.ts`).
- **Secrets at rest:** bank tokens and MFA secrets use AES-256-GCM (`lib/secure-crypto.ts`).
- **Audit trail:** `ActivityLog` is append-only and hash-chained per organisation (`lib/prisma.ts`); verify with `GET /api/activity-log/verify`.
- **Website enquiries:** `POST /api/enquiries` accepts only origins in `MARKETING_ORIGINS`, requires privacy consent and has a honeypot and throttle.

## Deploying

Vercel runs `npm run vercel-build`. On **production** builds it applies pending migrations (`prisma migrate deploy`) before `next build`; preview builds never touch the database. If a migration fails, the build fails and the previous deployment keeps serving.

If production was originally created with `prisma db push` (no `_prisma_migrations` table), baseline it once before the first deploy:

```bash
npx prisma migrate resolve --applied 20260401190631_init_postgresql
npx prisma migrate resolve --applied 20260408203614_add_platform_metrics
npx prisma migrate resolve --applied 20260415161717_add_multitenancy
npx prisma migrate resolve --applied 20260415173505_add_onboarding_flag
```

The repair and OneView migrations are then applied by the build; both are safe on a database that already has some of the objects.

Production environment variables to add before deploying: `MARKETING_ORIGINS` (the website URL), `REQUIRE_MFA=true`, and the `STITCH_*` values once Stitch issues them. Admins, approvers and executors must enrol an authenticator under Settings → Security before approving payments.

## Known gaps (next steps)

- Money is stored as `Float`; migrate to integer cents.
- Postgres row-level security as a second isolation layer.
- Move the database to a South African region before onboarding real customer data.
- Direct payment execution stays off until a legal opinion and SARB authorisation or sponsorship are in place.
