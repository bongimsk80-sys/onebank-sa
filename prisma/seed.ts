import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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

  // Users
  const hashedAdmin = await bcrypt.hash("OneBankAdmin2026!", 12);
  const hashedApprover = await bcrypt.hash("OneBankApprove2026!", 12);
  const hashedInitiator = await bcrypt.hash("OneBankInit2026!", 12);
  const hashedReviewer = await bcrypt.hash("OneBankReview2026!", 12);
  const hashedExecutor = await bcrypt.hash("OneBankExec2026!", 12);
  const hashedViewer = await bcrypt.hash("OneBankView2026!", 12);

  await prisma.user.deleteMany();
  await prisma.user.createMany({
    data: [
      {
        name: "Bonginkosi Masuku",
        email: "admin@onebank.co.za",
        password: hashedAdmin,
        role: "admin",
        isActive: true,
      },
      {
        name: "Sarah Dlamini",
        email: "approver@onebank.co.za",
        password: hashedApprover,
        role: "approver",
        isActive: true,
      },
      {
        name: "Thabo Mokoena",
        email: "initiator@onebank.co.za",
        password: hashedInitiator,
        role: "initiator",
        isActive: true,
      },
      {
        name: "Lisa van der Merwe",
        email: "reviewer@onebank.co.za",
        password: hashedReviewer,
        role: "reviewer",
        isActive: true,
      },
      {
        name: "John Nkosi",
        email: "executor@onebank.co.za",
        password: hashedExecutor,
        role: "executor",
        isActive: true,
      },
      {
        name: "Nomsa Zulu",
        email: "viewer@onebank.co.za",
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

  // Transactions
  await prisma.transaction.createMany({
    data: [
      {
        name: "Eskom Holdings",
        type: "EFT Payment",
        amount: -45000.0,
        date: new Date("2024-03-26"),
        bank: "FNB",
        accountNumber: "62123456789",
        reference: "ESKOM-INV-2024-001",
        status: "completed",
        bankAccountId: fnb.id,
      },
      {
        name: "Client Payment - Acme Corp",
        type: "EFT Receipt",
        amount: 120000.0,
        date: new Date("2024-03-26"),
        bank: "Standard Bank",
        accountNumber: "27198765432",
        reference: "ACME-PAY-003",
        status: "completed",
        bankAccountId: standardBank.id,
      },
      {
        name: "Office Rentals SA",
        type: "EFT Payment",
        amount: -28500.0,
        date: new Date("2024-03-25"),
        bank: "Absa",
        accountNumber: "40987654321",
        reference: "RENT-MAR-2024",
        status: "completed",
        bankAccountId: absa.id,
      },
      {
        name: "Telkom SA",
        type: "EFT Payment",
        amount: -3200.0,
        date: new Date("2024-03-25"),
        bank: "Nedbank",
        accountNumber: "19234567890",
        reference: "TELKOM-MAR-2024",
        status: "completed",
        bankAccountId: nedbank.id,
      },
      {
        name: "SARS",
        type: "EFT Payment",
        amount: -18750.0,
        date: new Date("2024-03-24"),
        bank: "FNB",
        accountNumber: "62123456789",
        reference: "SARS-PAYE-MAR",
        status: "completed",
        bankAccountId: fnb.id,
      },
      {
        name: "Supplier Payment - BuildRight",
        type: "EFT Payment",
        amount: -67000.0,
        date: new Date("2024-03-24"),
        bank: "Standard Bank",
        accountNumber: "27198765432",
        reference: "BUILD-INV-0042",
        status: "completed",
        bankAccountId: standardBank.id,
      },
      {
        name: "Client Payment - Zenith Ltd",
        type: "EFT Receipt",
        amount: 95000.0,
        date: new Date("2024-03-23"),
        bank: "FNB",
        accountNumber: "62123456789",
        reference: "ZENITH-PAY-021",
        status: "completed",
        bankAccountId: fnb.id,
      },
      {
        name: "MTN Business",
        type: "EFT Payment",
        amount: -4800.0,
        date: new Date("2024-03-23"),
        bank: "Capitec",
        accountNumber: "13456789012",
        reference: "MTN-MAR-2024",
        status: "completed",
        bankAccountId: capitec.id,
      },
      {
        name: "Sasol Supplier",
        type: "EFT Payment",
        amount: -112000.0,
        date: new Date("2024-03-22"),
        bank: "Absa",
        accountNumber: "40987654321",
        reference: "SASOL-INV-2024",
        status: "pending",
        bankAccountId: absa.id,
      },
      {
        name: "City of Joburg",
        type: "EFT Payment",
        amount: -8900.0,
        date: new Date("2024-03-22"),
        bank: "Nedbank",
        accountNumber: "19234567890",
        reference: "COJ-RATES-MAR",
        status: "rejected",
        bankAccountId: nedbank.id,
      },
    ],
  });

  // Payments
  await prisma.payment.createMany({
    data: [
      {
        beneficiary: "Eskom Holdings",
        bank: "FNB",
        amount: 45000.0,
        type: "local",
        status: "pending",
        initiatedBy: "Bonginkosi M.",
        date: new Date("2024-03-26"),
        reference: "ESKOM-INV-2024-001",
        description: "Electricity supply payment Q1",
        priority: true,
      },
      {
        beneficiary: "BuildRight Suppliers",
        bank: "Standard Bank",
        amount: 67000.0,
        type: "local",
        status: "approved",
        initiatedBy: "Bonginkosi M.",
        date: new Date("2024-03-25"),
        reference: "BUILD-INV-0042",
        description: "Construction materials March",
        priority: false,
      },
      {
        beneficiary: "Sasol Limited",
        bank: "Absa",
        amount: 112000.0,
        type: "local",
        status: "inprogress",
        initiatedBy: "Bonginkosi M.",
        date: new Date("2024-03-25"),
        reference: "SASOL-INV-2024",
        description: "Fuel & chemical supplies",
        priority: true,
      },
      {
        beneficiary: "HSBC London",
        bank: "Standard Bank",
        amount: 250000.0,
        type: "international",
        status: "pending",
        initiatedBy: "Bonginkosi M.",
        date: new Date("2024-03-24"),
        reference: "HSBC-SWIFT-001",
        description: "International equipment purchase",
        priority: true,
      },
      {
        beneficiary: "City of Joburg",
        bank: "Nedbank",
        amount: 8900.0,
        type: "local",
        status: "rejected",
        initiatedBy: "Bonginkosi M.",
        date: new Date("2024-03-24"),
        reference: "COJ-RATES-MAR",
        description: "Municipal rates March 2024",
        priority: false,
      },
      {
        beneficiary: "Office Rentals SA",
        bank: "Absa",
        amount: 28500.0,
        type: "same-bank",
        status: "settled",
        initiatedBy: "Bonginkosi M.",
        date: new Date("2024-03-23"),
        reference: "RENT-MAR-2024",
        description: "Monthly office rental",
        priority: false,
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
        description: "Failed login attempt for admin@onebank.co.za",
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