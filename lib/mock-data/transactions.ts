export type Transaction = {
  id: string;
  name: string;
  type: string;
  amount: number;
  date: string;
  bank: string;
  accountNumber: string;
  reference: string;
  status: "completed" | "pending" | "rejected";
};

export const mockTransactions: Transaction[] = [
  {
    id: "t1",
    name: "Eskom Holdings",
    type: "EFT Payment",
    amount: -45000.0,
    date: "2024-03-26",
    bank: "FNB",
    accountNumber: "62123456789",
    reference: "ESKOM-INV-2024-001",
    status: "completed",
  },
  {
    id: "t2",
    name: "Client Payment - Acme Corp",
    type: "EFT Receipt",
    amount: 120000.0,
    date: "2024-03-26",
    bank: "Standard Bank",
    accountNumber: "27198765432",
    reference: "ACME-PAY-003",
    status: "completed",
  },
  {
    id: "t3",
    name: "Office Rentals SA",
    type: "EFT Payment",
    amount: -28500.0,
    date: "2024-03-25",
    bank: "Absa",
    accountNumber: "40987654321",
    reference: "RENT-MAR-2024",
    status: "completed",
  },
  {
    id: "t4",
    name: "Telkom SA",
    type: "EFT Payment",
    amount: -3200.0,
    date: "2024-03-25",
    bank: "Nedbank",
    accountNumber: "19234567890",
    reference: "TELKOM-MAR-2024",
    status: "completed",
  },
  {
    id: "t5",
    name: "SARS",
    type: "EFT Payment",
    amount: -18750.0,
    date: "2024-03-24",
    bank: "FNB",
    accountNumber: "62123456789",
    reference: "SARS-PAYE-MAR",
    status: "completed",
  },
  {
    id: "t6",
    name: "Supplier Payment - BuildRight",
    type: "EFT Payment",
    amount: -67000.0,
    date: "2024-03-24",
    bank: "Standard Bank",
    accountNumber: "27198765432",
    reference: "BUILD-INV-0042",
    status: "completed",
  },
  {
    id: "t7",
    name: "Client Payment - Zenith Ltd",
    type: "EFT Receipt",
    amount: 95000.0,
    date: "2024-03-23",
    bank: "FNB",
    accountNumber: "62123456789",
    reference: "ZENITH-PAY-021",
    status: "completed",
  },
  {
    id: "t8",
    name: "MTN Business",
    type: "EFT Payment",
    amount: -4800.0,
    date: "2024-03-23",
    bank: "Capitec",
    accountNumber: "13456789012",
    reference: "MTN-MAR-2024",
    status: "completed",
  },
  {
    id: "t9",
    name: "Sasol Supplier",
    type: "EFT Payment",
    amount: -112000.0,
    date: "2024-03-22",
    bank: "Absa",
    accountNumber: "40987654321",
    reference: "SASOL-INV-2024",
    status: "pending",
  },
  {
    id: "t10",
    name: "City of Joburg",
    type: "EFT Payment",
    amount: -8900.0,
    date: "2024-03-22",
    bank: "Nedbank",
    accountNumber: "19234567890",
    reference: "COJ-RATES-MAR",
    status: "rejected",
  },
];

export const bankFilters = [
  { id: "all", label: "All Banks" },
  { id: "FNB", label: "FNB" },
  { id: "Standard Bank", label: "Standard Bank" },
  { id: "Absa", label: "Absa" },
  { id: "Nedbank", label: "Nedbank" },
  { id: "Capitec", label: "Capitec" },
];