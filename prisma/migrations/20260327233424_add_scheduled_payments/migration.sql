-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "beneficiary" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "initiatedBy" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" BOOLEAN NOT NULL DEFAULT false,
    "scheduledDate" DATETIME,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_payments" ("amount", "bank", "beneficiary", "createdAt", "date", "description", "id", "initiatedBy", "priority", "reference", "status", "type", "updatedAt") SELECT "amount", "bank", "beneficiary", "createdAt", "date", "description", "id", "initiatedBy", "priority", "reference", "status", "type", "updatedAt" FROM "payments";
DROP TABLE "payments";
ALTER TABLE "new_payments" RENAME TO "payments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
