-- CreateTable
CREATE TABLE "platform_metrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metricType" TEXT NOT NULL,
    "totalTransactions" INTEGER NOT NULL DEFAULT 0,
    "totalTransactionValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPayments" INTEGER NOT NULL DEFAULT 0,
    "totalPaymentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "totalBeneficiaries" INTEGER NOT NULL DEFAULT 0,
    "bankBreakdown" TEXT NOT NULL DEFAULT '[]',
    "roleBreakdown" TEXT NOT NULL DEFAULT '[]',
    "statusBreakdown" TEXT NOT NULL DEFAULT '[]',
    "peakHour" INTEGER,
    "avgPaymentSize" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "approvedPayments" INTEGER NOT NULL DEFAULT 0,
    "rejectedPayments" INTEGER NOT NULL DEFAULT 0,
    "settledPayments" INTEGER NOT NULL DEFAULT 0,
    "pendingPayments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_metrics_pkey" PRIMARY KEY ("id")
);
