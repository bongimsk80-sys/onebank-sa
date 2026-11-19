import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Protected by PLATFORM_METRICS_TOKEN. Applies the two pending migrations
// via PrismaClient TCP (same connection the app uses — works from Vercel).
// All statements are idempotent — safe to call more than once.
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = process.env.PLATFORM_METRICS_TOKEN;
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  }

  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  const results: string[] = [];

  const run = (stmt: string) => prisma.$executeRawUnsafe(stmt);

  try {
    // ── Migration 1: repair_schema_drift ──────────────────────────────────────
    await run(`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "initiatorId" TEXT`);
    await run(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "inviteTokenExpiry" TIMESTAMP(3)`);
    await run(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3)`);
    await run(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verificationTokenExpiry" TIMESTAMP(3)`);
    await run(`DROP INDEX IF EXISTS "transfer_limits_role_key"`);
    await run(`CREATE INDEX IF NOT EXISTS "activity_logs_organisationId_createdAt_idx" ON "activity_logs"("organisationId", "createdAt" DESC)`);
    await run(`CREATE INDEX IF NOT EXISTS "approval_workflows_organisationId_idx" ON "approval_workflows"("organisationId")`);
    await run(`CREATE INDEX IF NOT EXISTS "bank_accounts_organisationId_idx" ON "bank_accounts"("organisationId")`);
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS "bank_accounts_organisationId_accountNumber_key" ON "bank_accounts"("organisationId", "accountNumber")`);
    await run(`CREATE INDEX IF NOT EXISTS "beneficiaries_organisationId_idx" ON "beneficiaries"("organisationId")`);
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS "beneficiaries_organisationId_accountNumber_key" ON "beneficiaries"("organisationId", "accountNumber")`);
    await run(`CREATE INDEX IF NOT EXISTS "erp_invoices_organisationId_dueDate_idx" ON "erp_invoices"("organisationId", "dueDate")`);
    await run(`CREATE INDEX IF NOT EXISTS "notifications_organisationId_read_idx" ON "notifications"("organisationId", "read")`);
    await run(`CREATE INDEX IF NOT EXISTS "payments_organisationId_status_idx" ON "payments"("organisationId", "status")`);
    await run(`CREATE INDEX IF NOT EXISTS "payments_organisationId_date_idx" ON "payments"("organisationId", "date" DESC)`);
    await run(`CREATE INDEX IF NOT EXISTS "transactions_organisationId_date_idx" ON "transactions"("organisationId", "date" DESC)`);
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS "transfer_limits_organisationId_role_key" ON "transfer_limits"("organisationId", "role")`);
    await run(`CREATE INDEX IF NOT EXISTS "users_verificationToken_idx" ON "users"("verificationToken")`);
    await run(`CREATE INDEX IF NOT EXISTS "users_resetToken_idx" ON "users"("resetToken")`);
    await run(`CREATE INDEX IF NOT EXISTS "users_inviteToken_idx" ON "users"("inviteToken")`);
    await run(`ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "activity_logs_organisationId_fkey"`);
    await run(`ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await run(`ALTER TABLE "approval_workflows" DROP CONSTRAINT IF EXISTS "approval_workflows_organisationId_fkey"`);
    await run(`ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await run(`ALTER TABLE "bank_accounts" DROP CONSTRAINT IF EXISTS "bank_accounts_organisationId_fkey"`);
    await run(`ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await run(`ALTER TABLE "beneficiaries" DROP CONSTRAINT IF EXISTS "beneficiaries_organisationId_fkey"`);
    await run(`ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await run(`ALTER TABLE "erp_connections" DROP CONSTRAINT IF EXISTS "erp_connections_organisationId_fkey"`);
    await run(`ALTER TABLE "erp_connections" ADD CONSTRAINT "erp_connections_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await run(`ALTER TABLE "erp_invoices" DROP CONSTRAINT IF EXISTS "erp_invoices_organisationId_fkey"`);
    await run(`ALTER TABLE "erp_invoices" ADD CONSTRAINT "erp_invoices_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await run(`ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_organisationId_fkey"`);
    await run(`ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await run(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_organisationId_fkey"`);
    await run(`ALTER TABLE "payments" ADD CONSTRAINT "payments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await run(`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_organisationId_fkey"`);
    await run(`ALTER TABLE "transactions" ADD CONSTRAINT "transactions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await run(`ALTER TABLE "transfer_limits" DROP CONSTRAINT IF EXISTS "transfer_limits_organisationId_fkey"`);
    await run(`ALTER TABLE "transfer_limits" ADD CONSTRAINT "transfer_limits_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    await run(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_organisationId_fkey"`);
    await run(`ALTER TABLE "users" ADD CONSTRAINT "users_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    results.push("migration 1 (repair_schema_drift): ok");

    // ── Migration 2: oneview_connectors_mfa_audit ─────────────────────────────
    await run(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfaEnabledAt" TIMESTAMP(3)`);
    await run(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfaSecretEnc" TEXT`);
    await run(`ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "availableBalance" DOUBLE PRECISION`);
    await run(`ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "connectionId" TEXT`);
    await run(`ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "externalId" TEXT`);
    await run(`ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP(3)`);
    await run(`ALTER TABLE "bank_accounts" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual'`);
    await run(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "dedupeHash" TEXT`);
    await run(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "externalId" TEXT`);
    await run(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual'`);
    await run(`ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "hash" TEXT`);
    await run(`ALTER TABLE "activity_logs" ADD COLUMN IF NOT EXISTS "prevHash" TEXT`);

    await run(`CREATE TABLE IF NOT EXISTS "bank_connections" (
      "id" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "label" TEXT,
      "externalUserId" TEXT,
      "accessTokenEnc" TEXT,
      "refreshTokenEnc" TEXT,
      "tokenExpiresAt" TIMESTAMP(3),
      "scopes" TEXT,
      "consentGrantedAt" TIMESTAMP(3),
      "consentGrantedById" TEXT,
      "consentExpiresAt" TIMESTAMP(3),
      "revokedAt" TIMESTAMP(3),
      "lastSyncedAt" TIMESTAMP(3),
      "lastError" TEXT,
      "organisationId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "bank_connections_pkey" PRIMARY KEY ("id")
    )`);

    await run(`CREATE TABLE IF NOT EXISTS "connection_auth_states" (
      "id" TEXT NOT NULL,
      "state" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "codeVerifierEnc" TEXT NOT NULL,
      "nonce" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "organisationId" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "connection_auth_states_pkey" PRIMARY KEY ("id")
    )`);

    await run(`CREATE TABLE IF NOT EXISTS "enquiries" (
      "id" TEXT NOT NULL,
      "firstName" TEXT NOT NULL,
      "lastName" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT,
      "company" TEXT NOT NULL,
      "role" TEXT,
      "banks" TEXT,
      "message" TEXT,
      "consentProcessing" BOOLEAN NOT NULL,
      "consentMarketing" BOOLEAN NOT NULL DEFAULT false,
      "source" TEXT NOT NULL DEFAULT 'website',
      "ipAddress" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
    )`);

    await run(`CREATE INDEX IF NOT EXISTS "bank_connections_organisationId_idx" ON "bank_connections"("organisationId")`);
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS "connection_auth_states_state_key" ON "connection_auth_states"("state")`);
    await run(`CREATE INDEX IF NOT EXISTS "enquiries_createdAt_idx" ON "enquiries"("createdAt" DESC)`);

    await run(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_accounts_connectionId_fkey') THEN
        ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_connectionId_fkey"
          FOREIGN KEY ("connectionId") REFERENCES "bank_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$`);

    await run(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bank_connections_organisationId_fkey') THEN
        ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_organisationId_fkey"
          FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$`);

    results.push("migration 2 (oneview_connectors_mfa_audit): ok");

    return NextResponse.json({ ok: true, results });
  } catch (err: unknown) {
    const e = err as { message?: string };
    return NextResponse.json({ ok: false, results, error: e.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
