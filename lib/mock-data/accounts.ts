export const mockAccounts = [
  {
    id: "1",
    bank: "FNB",
    accountNumber: "62123456789",
    accountType: "Business Cheque",
    balance: 245750.0,
    currency: "ZAR",
    color: "#006B3C",
  },
  {
    id: "2",
    bank: "Standard Bank",
    accountNumber: "27198765432",
    accountType: "Business Current",
    balance: 128300.5,
    currency: "ZAR",
    color: "#0033A0",
  },
  {
    id: "3",
    bank: "Absa",
    accountNumber: "40987654321",
    accountType: "Business Cheque",
    balance: 89450.75,
    currency: "ZAR",
    color: "#DC0032",
  },
  {
    id: "4",
    bank: "Nedbank",
    accountNumber: "19234567890",
    accountType: "Business Current",
    balance: 167200.0,
    currency: "ZAR",
    color: "#007B40",
  },
  {
    id: "5",
    bank: "Capitec",
    accountNumber: "13456789012",
    accountType: "Business Savings",
    balance: 54100.25,
    currency: "ZAR",
    color: "#007DC5",
  },
];

export const mockPaymentsSummary = {
  period: "Last 30 days",
  totalAmount: 284500.0,
  pending: 4,
  approved: 14,
  settled: 10,
  rejected: 1,
  inProgress: 6,
};

export const mockPaymentsPending = [
  { label: "Reviewer pending", count: 8, icon: "refresh" },
  { label: "Approver pending", count: 4, icon: "check" },
  { label: "Executor pending", count: 6, icon: "upload" },
  { label: "Bank rejected", count: 1, icon: "bank" },
];

export const mockRecentTransactions = [
  {
    id: "t1",
    name: "Eskom Holdings",
    type: "EFT Payment",
    amount: -45000.0,
    date: "Today",
    bank: "FNB",
  },
  {
    id: "t2",
    name: "Client Payment",
    type: "EFT Receipt",
    amount: 120000.0,
    date: "Today",
    bank: "Standard Bank",
  },
  {
    id: "t3",
    name: "Office Rentals SA",
    type: "EFT Payment",
    amount: -28500.0,
    date: "Yesterday",
    bank: "Absa",
  },
  {
    id: "t4",
    name: "Telkom SA",
    type: "EFT Payment",
    amount: -3200.0,
    date: "Yesterday",
    bank: "Nedbank",
  },
  {
    id: "t5",
    name: "SARS",
    type: "EFT Payment",
    amount: -18750.0,
    date: "26 Mar",
    bank: "FNB",
  },
];
