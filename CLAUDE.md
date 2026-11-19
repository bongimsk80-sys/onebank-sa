@AGENTS.md
@docs/HANDOFF.md

# Working rules for this repo

- Read `docs/HANDOFF.md` first: it holds the product decisions, current deployment state and next steps.
- The product is **OneView**. Never use "bank" in the product or company name (Banks Act s22(5)).
- No real money moves. Do not build live payment execution without the owner confirming a legal opinion and SARB authorisation or a licensed sponsor.
- Every API route must scope data to the user's organisation and return 403 when there is none.
- Bank data goes through `lib/connectors` only. Yodlee stays disabled.
- Privileged mutations call `requireMfa`. Audit log rows are never updated or deleted.
- Schema changes need a migration; never `prisma db push` against production.
- Work on a branch and open a pull request. Pushing or merging to `main` deploys production on Vercel.
- Before a PR: `npx tsc --noEmit`, `npm test`, `npm run build`.
