-- CreateTable
CREATE TABLE "transfer_limits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "dailyLimit" REAL NOT NULL DEFAULT 0,
    "perTxLimit" REAL NOT NULL DEFAULT 0,
    "monthlyLimit" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "transfer_limits_role_key" ON "transfer_limits"("role");
