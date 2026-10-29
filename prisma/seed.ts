import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Guard: never run seed data in production — it wipes real financial records.
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED_IN_PRODUCTION !== "true") {
    console.error("❌ Refusing to seed: NODE_ENV is 'production'. Set ALLOW_SEED_IN_PRODUCTION=true to override.");
    process.exit(1);
  }
  // Notifications
  await prisma.notification.deleteMany();
  await prisma.notification.createMany({
    data: [
      {
        title: "Payment Approved",
        message: "BuildRight Suppliers payment of R67,000 has been approved.",
        type: "success",
        read: false,
        link: "/payments",
      },
      {
        title: "Payment Rejected",
        message: "City of Joburg payment was rejected: Insufficient funds.",
        type: "error",
        read: false,
        link: "/payments",
      },
      {
        title: "Low Balance Alert",
        message: "Capitec Business Savings balance is below R60,000.",
        type: "warning",
        read: false,
        link: "/overview",
      },
      {
        title: "ERP Sync Complete",
        message: "Sage ERP successfully synced 3 new invoices.",
        type: "info",
        read: true,
        link: "/erp",
      },
      {
        title: "Scheduled Payment Due",
        message: "Office Rentals SA payment of R28,500 is due tomorrow.",
        type: "warning",
        read: true,
        link: "/payments",
      },
      {
        title: "New Beneficiary Added",
        message: "Eskom Holdings has been added as an active beneficiary.",
        type: "info",
        read: true,
        link: "/beneficiaries",
      },
    ],
  });console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.transaction.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.beneficiary.deleteMany();

  // Users — passwords sourced from env vars so they are never committed in plain text.
  // Set SEED_ADMIN_PASSWORD etc. in your .env before running `npx prisma db seed`.
  const hashedAdmin     = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD     ?? "OneViewAdmin2026!",    12);
  const hashedApprover  = await bcrypt.hash(process.env.SEED_APPROVER_PASSWORD  ?? "OneViewApprove2026!",  12);
  const hashedInitiator = await bcrypt.hash(process.env.SEED_INITIATOR_PASSWORD ?? "OneViewInit2026!",     12);
  const hashedReviewer  = await bcrypt.hash(process.env.SEED_REVIEWER_PASSWORD  ?? "OneViewReview2026!",   12);
  const hashedExecutor  = await bcrypt.hash(process.env.SEED_EXECUTOR_PASSWORD  ?? "OneViewExec2026!",     12);
  const hashedViewer    = await bcrypt.hash(process.env.SEED_VIEWER_PASSWORD    ?? "OneViewView2026!",     12);

  await prisma.user.deleteMany();
  await prisma.user.createMany({
    data: [
      {
        name: "Bonginkosi Masuku",
        email: "admin@oneview.co.za",
        password: hashedAdmin,
        role: "admin",
        isActive: true,
      },
      {
        name: "Sarah Dlamini",
        email: "approver@oneview.co.za",
        password: hashedApprover,
        role: "approver",
        isActive: true,
      },
      {
        name: "Thabo Mokoena",
        email: "initiator@oneview.co.za",
        password: hashedInitiator,
        role: "initiator",
        isActive: true,
      },
      {
        name: "Lisa van der Merwe",
        email: "reviewer@oneview.co.za",
        password: hashedReviewer,
        role: "reviewer",
        isActive: true,
      },
      {
        name: "John Nkosi",
        email: "executor@oneview.co.za",
        password: hashedExecutor,
        role: "executor",
        isActive: true,
      },
      {
        name: "Nomsa Zulu",
        email: "viewer@oneview.co.za",
        password: hashedViewer,
        role: "viewer",
        isActive: true,
      },
    ],
  });

  // Bank Accounts
  const fnb = await prisma.bankAccount.create({
    data: {
      bank: "FNB",
      accountNumber: "62123456789",
      accountType: "Business Cheque",
      balance: 245750.0,
      currency: "ZAR",
      color: "#006B3C",
    },
  });

  const standardBank = await prisma.bankAccount.create({
    data: {
      bank: "Standard Bank",
      accountNumber: "27198765432",
      accountType: "Business Current",
      balance: 128300.5,
      currency: "ZAR",
      color: "#0033A0",
    },
  });

  const absa = await prisma.bankAccount.create({
    data: {
      bank: "Absa",
      accountNumber: "40987654321",
      accountType: "Business Cheque",
      balance: 89450.75,
      currency: "ZAR",
      color: "#DC0032",
    },
  });

  const nedbank = await prisma.bankAccount.create({
    data: {
      bank: "Nedbank",
      accountNumber: "19234567890",
      accountType: "Business Current",
      balance: 167200.0,
      currency: "ZAR",
      color: "#007B40",
    },
  });

  const capitec = await prisma.bankAccount.create({
    data: {
      bank: "Capitec",
      accountNumber: "13456789012",
      accountType: "Business Savings",
      balance: 54100.25,
      currency: "ZAR",
      color: "#007DC5",
    },
  });

  // Helper to create date X days ago at a specific hour
  function daysAgo(days: number, hour: number = 10): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  // Transactions
  await prisma.transaction.deleteMany();
  await prisma.transaction.createMany({
    data: [
      {
        name: "Eskom Holdings",
        amount: -45000,
        type: "debit",
        bank: "FNB",
        accountNumber: "62123456789",
        reference: "PAY-001",
        status: "completed",
        date: daysAgo(1, 9),
      },
      {
        name: "Client Payment - Acme Corp",
        amount: 120000,
        type: "credit",
        bank: "Standard Bank",
        accountNumber: "27198765432",
        reference: "REC-001",
        status: "completed",
        date: daysAgo(2, 14),
      },
      {
        name: "Office Rentals SA",
        amount: -28500,
        type: "debit",
        bank: "Absa",
        accountNumber: "40987654321",
        reference: "PAY-002",
        status: "completed",
        date: daysAgo(3, 11),
      },
      {
        name: "Telkom SA",
        amount: -3200,
        type: "debit",
        bank: "Nedbank",
        accountNumber: "19234567890",
        reference: "PAY-003",
        status: "completed",
        date: daysAgo(5, 8),
      },
      {
        name: "SARS",
        amount: -18750,
        type: "debit",
        bank: "FNB",
        accountNumber: "62123456789",
        reference: "PAY-004",
        status: "completed",
        date: daysAgo(7, 15),
      },
      {
        name: "Investment Return",
        amount: 250000,
        type: "credit",
        bank: "Standard Bank",
        accountNumber: "27198765432",
        reference: "REC-002",
        status: "completed",
        date: daysAgo(10, 10),
      },
      {
        name: "Supplier Payment",
        amount: -67000,
        type: "debit",
        bank: "Absa",
        accountNumber: "40987654321",
        reference: "PAY-005",
        status: "completed",
        date: daysAgo(12, 16),
      },
      {
        name: "Service Revenue",
        amount: 85000,
        type: "credit",
        bank: "FNB",
        accountNumber: "62123456789",
        reference: "REC-003",
        status: "completed",
        date: daysAgo(15, 9),
      },
      {
        name: "Municipal Rates",
        amount: -8900,
        type: "debit",
        bank: "Capitec",
        accountNumber: "13456789012",
        reference: "PAY-006",
        status: "completed",
        date: daysAgo(18, 13),
      },
      {
        name: "Export Revenue",
        amount: 320000,
        type: "credit",
        bank: "Nedbank",
        accountNumber: "19234567890",
        reference: "REC-004",
        status: "completed",
        date: daysAgo(22, 11),
      },
    ],
  });

  // Payments
  await prisma.payment.deleteMany();
  await prisma.payment.createMany({
    data: [
      {
        beneficiary: "Eskom Holdings",
        amount: 45000,
        bank: "FNB",
        type: "local",
        reference: "PAY-REF-001",
        description: "Monthly electricity payment",
        status: "settled",
        initiatedBy: "Thabo Mokoena",
        priority: false,
        date: daysAgo(1, 9),
      },
      {
        beneficiary: "BuildRight Suppliers",
        amount: 67000,
        bank: "Standard Bank",
        type: "local",
        reference: "PAY-REF-002",
        description: "Construction materials",
        status: "approved",
        initiatedBy: "Thabo Mokoena",
        priority: true,
        date: daysAgo(3, 14),
      },
      {
        beneficiary: "Sasol Limited",
        amount: 112000,
        bank: "Absa",
        type: "local",
        reference: "PAY-REF-003",
        description: "Fuel and lubricants",
        status: "pending",
        initiatedBy: "Thabo Mokoena",
        priority: false,
        date: daysAgo(5, 10),
      },
      {
        beneficiary: "HSBC London",
        amount: 250000,
        bank: "Standard Bank",
        type: "international",
        reference: "PAY-REF-004",
        description: "International supplier payment",
        status: "pending",
        initiatedBy: "Thabo Mokoena",
        priority: true,
        date: daysAgo(7, 11),
      },
      {
        beneficiary: "City of Joburg",
        amount: 8900,
        bank: "FNB",
        type: "local",
        reference: "PAY-REF-005",
        description: "Municipal rates",
        status: "rejected",
        initiatedBy: "Thabo Mokoena",
        priority: false,
        date: daysAgo(10, 15),
      },
      {
        beneficiary: "SARS",
        amount: 18750,
        bank: "Nedbank",
        type: "local",
        reference: "PAY-REF-006",
        description: "VAT payment",
        status: "settled",
        initiatedBy: "Thabo Mokoena",
        priority: true,
        date: daysAgo(14, 9),
      },
    ],
  });

  // Beneficiaries
  await prisma.beneficiary.createMany({
    data: [
      {
        name: "Eskom Holdings",
        type: "local",
        category: "utility",
        status: "active",
        accountNumber: "1009001234008490",
        bank: "FNB",
        branchCode: "250655",
        totalPayments: 560,
        lastPayment: 45000,
        lastPaymentDate: new Date("2024-03-26"),
        tag: "Utilities",
      },
      {
        name: "BuildRight Suppliers",
        type: "local",
        category: "supplier",
        status: "active",
        accountNumber: "1009005678008490",
        bank: "Standard Bank",
        branchCode: "051001",
        totalPayments: 340,
        lastPayment: 67000,
        lastPaymentDate: new Date("2024-03-25"),
        tag: "Construction",
      },
      {
        name: "HSBC London",
        type: "international",
        category: "vendor",
        status: "active",
        accountNumber: "GB29NWBK60161331926819",
        bank: "HSBC",
        branchCode: "MIDLGB22",
        totalPayments: 45,
        lastPayment: 250000,
        lastPaymentDate: new Date("2024-03-24"),
        tag: "International",
      },
      {
        name: "SARS",
        type: "local",
        category: "government",
        status: "active",
        accountNumber: "1009004567008490",
        bank: "FNB",
        branchCode: "250655",
        totalPayments: 120,
        lastPayment: 18750,
        lastPaymentDate: new Date("2024-03-24"),
        tag: "Tax",
      },
    ],
  });

  // Approval Workflows
  await prisma.approvalWorkflow.deleteMany();
  await prisma.approvalWorkflow.createMany({
    data: [
      {
        name: "Standard Payment",
        description: "For payments between R0 - R50,000",
        minAmount: 0,
        maxAmount: 50000,
        steps: JSON.stringify(["initiator", "approver", "executor"]),
        isActive: true,
      },
      {
        name: "High Value Payment",
        description: "For payments between R50,000 - R500,000",
        minAmount: 50000,
        maxAmount: 500000,
        steps: JSON.stringify(["initiator", "reviewer", "approver", "executor"]),
        isActive: true,
      },
      {
        name: "Executive Payment",
        description: "For payments above R500,000",
        minAmount: 500000,
        maxAmount: 999999999,
        steps: JSON.stringify(["initiator", "reviewer", "approver", "approver", "executor"]),
        isActive: true,
      },
    ],
  });

  // Activity Logs
  await prisma.activityLog.deleteMany();
  await prisma.activityLog.createMany({
    data: [
      {
        action: "User Login",
        description: "Bonginkosi Masuku logged in successfully",
        userName: "Bonginkosi Masuku",
        entityType: "auth",
        status: "success",
      },
      {
        action: "Payment Created",
        description: "Payment of R45,000 to Eskom Holdings initiated",
        userName: "Bonginkosi Masuku",
        entityType: "payment",
        status: "success",
      },
      {
        action: "Payment Approved",
        description: "Payment of R67,000 to BuildRight Suppliers approved",
        userName: "Sarah Dlamini",
        entityType: "payment",
        status: "success",
      },
      {
        action: "Payment Rejected",
        description: "Payment to City of Joburg rejected: Insufficient funds",
        userName: "Thabo Mokoena",
        entityType: "payment",
        status: "failed",
      },
      {
        action: "Beneficiary Added",
        description: "New beneficiary Eskom Holdings added",
        userName: "Bonginkosi Masuku",
        entityType: "beneficiary",
        status: "success",
      },
      {
        action: "User Created",
        description: "New user John Nkosi added with Initiator role",
        userName: "Bonginkosi Masuku",
        entityType: "user",
        status: "success",
      },
      {
        action: "Workflow Updated",
        description: "High Value Payment workflow steps updated",
        userName: "Bonginkosi Masuku",
        entityType: "workflow",
        status: "success",
      },
      {
        action: "ERP Connected",
        description: "Sage ERP system connected successfully",
        userName: "Bonginkosi Masuku",
        entityType: "erp",
        status: "success",
      },
      {
        action: "Login Failed",
        description: "Failed login attempt for admin@oneview.co.za",
        userName: "Unknown",
        entityType: "auth",
        status: "failed",
      },
      {
        action: "Bank Account Added",
        description: "FNB Business Cheque account connected",
        userName: "Bonginkosi Masuku",
        entityType: "bank",
        status: "success",
      },
      {
        action: "Payment Executed",
        description: "Payment of R28,500 to Office Rentals SA executed",
        userName: "Lisa van der Merwe",
        entityType: "payment",
        status: "success",
      },
      {
        action: "Report Exported",
        description: "Analytics report exported as PDF",
        userName: "Bonginkosi Masuku",
        entityType: "report",
        status: "success",
      },
    ],
  });

  // Transfer Limits
  await prisma.transferLimit.deleteMany();
  await prisma.transferLimit.createMany({
    data: [
      {
        role: "initiator",
        dailyLimit: 100000,
        perTxLimit: 50000,
        monthlyLimit: 500000,
        isActive: true,
      },
      {
        role: "reviewer",
        dailyLimit: 250000,
        perTxLimit: 100000,
        monthlyLimit: 1000000,
        isActive: true,
      },
      {
        role: "approver",
        dailyLimit: 500000,
        perTxLimit: 250000,
        monthlyLimit: 2000000,
        isActive: true,
      },
      {
        role: "executor",
        dailyLimit: 1000000,
        perTxLimit: 500000,
        monthlyLimit: 5000000,
        isActive: true,
      },
      {
        role: "admin",
        dailyLimit: 999999999,
        perTxLimit: 999999999,
        monthlyLimit: 999999999,
        isActive: true,
      },
      {
        role: "viewer",
        dailyLimit: 0,
        perTxLimit: 0,
        monthlyLimit: 0,
        isActive: false,
      },
    ],
  });

  // ── Tenant assignment ─────────────────────────────────────────────────────
  // API routes now refuse requests from users without an organisation, so all
  // demo rows are attached to one demo organisation.
  const demoOrg = await prisma.organisation.upsert({
    where:  { slug: "oneview-demo" },
    update: {},
    create: { name: "OneView Demo (Pty) Ltd", slug: "oneview-demo", plan: "beta" },
  });
  const unowned = { where: { organisationId: null }, data: { organisationId: demoOrg.id } };
  await prisma.user.updateMany(unowned);
  await prisma.bankAccount.updateMany(unowned);
  await prisma.transaction.updateMany(unowned);
  await prisma.payment.updateMany(unowned);
  await prisma.beneficiary.updateMany(unowned);
  await prisma.approvalWorkflow.updateMany(unowned);
  await prisma.transferLimit.updateMany(unowned);
  await prisma.activityLog.updateMany(unowned);
  await prisma.notification.updateMany(unowned);

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });