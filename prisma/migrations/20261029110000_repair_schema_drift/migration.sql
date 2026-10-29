-- Repairs drift between the migration history and schema.prisma.
-- Earlier columns, indexes and cascade rules were applied with `prisma db push`
-- and never recorded as migrations, so a fresh database built from migrations
-- was missing them. Every statement is idempotent: safe on a database that
-- already has these objects (production) and on a new one.

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "initiatorId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "inviteTokenExpiry" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verificationTokenExpiry" TIMESTAMP(3);
DROP INDEX IF EXISTS "transfer_limits_role_key";
CREATE INDEX IF NOT EXISTS "activity_logs_organisationId_createdAt_idx" ON "activity_logs"("organisationId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "approval_workflows_organisationId_idx" ON "approval_workflows"("organisationId");
CREATE INDEX IF NOT EXISTS "bank_accounts_organisationId_idx" ON "bank_accounts"("organisationId");
CREATE UNIQUE INDEX IF NOT EXISTS "bank_accounts_organisationId_accountNumber_key" ON "bank_accounts"("organisationId", "accountNumber");
CREATE INDEX IF NOT EXISTS "beneficiaries_organisationId_idx" ON "beneficiaries"("organisationId");
CREATE UNIQUE INDEX IF NOT EXISTS "beneficiaries_organisationId_accountNumber_key" ON "beneficiaries"("organisationId", "accountNumber");
CREATE INDEX IF NOT EXISTS "erp_invoices_organisationId_dueDate_idx" ON "erp_invoices"("organisationId", "dueDate");
CREATE INDEX IF NOT EXISTS "notifications_organisationId_read_idx" ON "notifications"("organisationId", "read");
CREATE INDEX IF NOT EXISTS "payments_organisationId_status_idx" ON "payments"("organisationId", "status");
CREATE INDEX IF NOT EXISTS "payments_organisationId_date_idx" ON "payments"("organisationId", "date" DESC);
CREATE INDEX IF NOT EXISTS "transactions_organisationId_date_idx" ON "transactions"("organisationId", "date" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "transfer_limits_organisationId_role_key" ON "transfer_limits"("organisationId", "role");
CREATE INDEX IF NOT EXISTS "users_verificationToken_idx" ON "users"("verificationToken");
CREATE INDEX IF NOT EXISTS "users_resetToken_idx" ON "users"("resetToken");
CREATE INDEX IF NOT EXISTS "users_inviteToken_idx" ON "users"("inviteToken");

-- Organisation foreign keys: cascade on delete, as the schema declares.
ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "activity_logs_organisationId_fkey";
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "approval_workflows" DROP CONSTRAINT IF EXISTS "approval_workflows_organisationId_fkey";
ALTER TABLE "approval_workflows" ADD CONSTRAINT "approval_workflows_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bank_accounts" DROP CONSTRAINT IF EXISTS "bank_accounts_organisationId_fkey";
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "beneficiaries" DROP CONSTRAINT IF EXISTS "beneficiaries_organisationId_fkey";
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "erp_connections" DROP CONSTRAINT IF EXISTS "erp_connections_organisationId_fkey";
ALTER TABLE "erp_connections" ADD CONSTRAINT "erp_connections_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "erp_invoices" DROP CONSTRAINT IF EXISTS "erp_invoices_organisationId_fkey";
ALTER TABLE "erp_invoices" ADD CONSTRAINT "erp_invoices_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_organisationId_fkey";
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_organisationId_fkey";
ALTER TABLE "payments" ADD CONSTRAINT "payments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_organisationId_fkey";
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transfer_limits" DROP CONSTRAINT IF EXISTS "transfer_limits_organisationId_fkey";
ALTER TABLE "transfer_limits" ADD CONSTRAINT "transfer_limits_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_organisationId_fkey";
ALTER TABLE "users" ADD CONSTRAINT "users_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
