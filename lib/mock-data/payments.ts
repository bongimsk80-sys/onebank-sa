export type Payment = {
  id: string;
  beneficiary: string;
  bank: string;
  amount: number;
  type: "same-bank" | "local" | "international";
  status: "pending" | "approved" | "rejected" | "settled" | "inprogress";
  initiatedBy: string;
  date: string;
  reference: string;
  description: string;
  priority: boolean;
};

export const mockPayments: Payment[] = [
  {
    id: "p1",
    beneficiary: "Eskom Holdings",
    bank: "FNB",
    amount: 45000.0,
    type: "local",
    status: "pending",
    initiatedBy: "Bonginkosi M.",
    date: "2024-03-26",
    reference: "ESKOM-INV-2024-001",
    description: "Electricity supply payment Q1",
    priority: true,
  },
  {
    id: "p2",
    beneficiary: "BuildRight Suppliers",
    bank: "Standard Bank",
    amount: 67000.0,
    type: "local",
    status: "approved",
    initiatedBy: "Bonginkosi M.",
    date: "2024-03-25",
    reference: "BUILD-INV-0042",
    description: "Construction materials March",
    priority: false,
  },
  {
    id: "p3",
    beneficiary: "Sasol Limited",
    bank: "Absa",
    amount: 112000.0,
    type: "local",
    status: "inprogress",
    initiatedBy: "Bonginkosi M.",
    date: "2024-03-25",
    reference: "SASOL-INV-2024",
    description: "Fuel & chemical supplies",
    priority: true,
  },
  {
    id: "p4",
    beneficiary: "HSBC London",
    bank: "Standard Bank",
    amount: 250000.0,
    type: "international",
    status: "pending",
    initiatedBy: "Bonginkosi M.",
    date: "2024-03-24",
    reference: "HSBC-SWIFT-001",
    description: "International equipment purchase",
    priority: true,
  },
  {
    id: "p5",
    beneficiary: "City of Joburg",
    bank: "Nedbank",
    amount: 8900.0,
    type: "local",
    status: "rejected",
    initiatedBy: "Bonginkosi M.",
    date: "2024-03-24",
    reference: "COJ-RATES-MAR",
    description: "Municipal rates March 2024",
    priority: false,
  },
  {
    id: "p6",
    beneficiary: "Office Rentals SA",
    bank: "Absa",
    amount: 28500.0,
    type: "same-bank",
    status: "settled",
    initiatedBy: "Bonginkosi M.",
    date: "2024-03-23",
    reference: "RENT-MAR-2024",
    description: "Monthly office rental",
    priority: false,
  },
  {
    id: "p7",
    beneficiary: "Telkom SA",
    bank: "Nedbank",
    amount: 3200.0,
    type: "local",
    status: "settled",
    initiatedBy: "Bonginkosi M.",
    date: "2024-03-23",
    reference: "TELKOM-MAR-2024",
    description: "Business fibre & telephone",
    priority: false,
  },
  {
    id: "p8",
    beneficiary: "MTN Business",
    bank: "Capitec",
    amount: 4800.0,
    type: "same-bank",
    status: "approved",
    initiatedBy: "Bonginkosi M.",
    date: "2024-03-22",
    reference: "MTN-MAR-2024",
    description: "Mobile data & voice plan",
    priority: false,
  },
];