-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mfaEnabledAt" TIMESTAMP(3),
ADD COLUMN     "mfaSecretEnc" TEXT;

-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN     "availableBalance" DOUBLE PRECISION,
ADD COLUMN     "connectionId" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "dedupeHash" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual';

-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "hash" TEXT,
ADD COLUMN     "prevHash" TEXT;

-- CreateTable
CREATE TABLE "bank_connections" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connection_auth_states" (
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
);

-- CreateTable
CREATE TABLE "enquiries" (
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
);

-- CreateIndex
CREATE INDEX "bank_connections_organisationId_idx" ON "bank_connections"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "connection_auth_states_state_key" ON "connection_auth_states"("state");

-- CreateIndex
CREATE INDEX "enquiries_createdAt_idx" ON "enquiries"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_connectionId_externalId_key" ON "bank_accounts"("connectionId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_bankAccountId_dedupeHash_key" ON "transactions"("bankAccountId", "dedupeHash");

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "bank_connections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

