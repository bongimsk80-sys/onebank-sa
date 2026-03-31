"use client";

import ExportButton from "@/components/shared/export-button";
import { exportTransactionsPDF, exportTransactionsExcel } from "@/lib/export";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";

function formatZAR(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-ZA", { day: "2-digit", month: "short" });
}

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: "#F0FDF4", text: "#27AE60", label: "Completed" },
  pending: { bg: "#FFF7ED", text: "#E67E22", label: "Pending" },
  rejected: { bg: "#FFF1F2", text: "#C0392B", label: "Rejected" },
};

const bankColors: Record<string, string> = {
  FNB: "#006B3C",
  "Standard Bank": "#0033A0",
  Absa: "#DC0032",
  Nedbank: "#007B40",
  Capitec: "#007DC5",
};

const bankFilters = [
  { id: "all", label: "All Banks" },
  { id: "FNB", label: "FNB" },
  { id: "Standard Bank", label: "Standard Bank" },
  { id: "Absa", label: "Absa" },
  { id: "Nedbank", label: "Nedbank" },
  { id: "Capitec", label: "Capitec" },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeBank, setActiveBank] = useState("all");

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const params = new URLSearchParams();
        if (activeBank !== "all") params.set("bank", activeBank);
        if (search) params.set("search", search);

        const res = await fetch(`/api/transactions?${params.toString()}`);
        const data = await res.json();
        setTransactions(data.transactions ?? []);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [activeBank, search]);

  const totalCredits = transactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalDebits = transactions
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <p className="text-xs text-[#718096] mb-1">Total Credits</p>
          <p className="text-sm font-bold text-[#27AE60]">
            +{formatZAR(totalCredits)}
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <p className="text-xs text-[#718096] mb-1">Total Debits</p>
          <p className="text-sm font-bold text-[#C0392B]">
            -{formatZAR(totalDebits)}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0]"
        />
        <Input
          placeholder="Search by name or reference..."
          className="pl-9 bg-white border-[#E2E8F0] rounded-xl text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Bank Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {bankFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveBank(filter.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeBank === filter.id
                ? "bg-[#1B4332] text-white"
                : "bg-white text-[#718096] border border-[#E2E8F0]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-[#718096]">
            {loading ? "Loading..." : `${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}`}
          </p>
          <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-xs text-[#1B4332] font-semibold">
            <SlidersHorizontal size={13} />
            Filter
          </button>
          <ExportButton
            onExportPDF={() => exportTransactionsPDF(transactions)}
            onExportExcel={() => exportTransactionsExcel(transactions)}
          />
        </div>
      </div>

        <Card className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm divide-y divide-[#E2E8F0]">
          {loading ? (
            <div className="py-12 text-center text-sm text-[#A0AEC0]">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#A0AEC0]">
              No transactions found
            </div>
          ) : (
            transactions.map((tx) => {
              const status = statusStyles[tx.status] ?? statusStyles.completed;
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[#F4F6F8] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#F4F6F8] flex items-center justify-center flex-shrink-0">
                      {tx.amount > 0 ? (
                        <ArrowDownRight size={16} className="text-[#27AE60]" />
                      ) : (
                        <ArrowUpRight size={16} className="text-[#C0392B]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1A202C] truncate">
                        {tx.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white"
                          style={{
                            backgroundColor: bankColors[tx.bank] ?? "#718096",
                          }}
                        >
                          {tx.bank}
                        </span>
                        <span className="text-xs text-[#718096]">{tx.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-2 max-w-[120px]">
                    <p
                      className={`text-sm font-bold ${
                        tx.amount > 0 ? "text-[#27AE60]" : "text-[#C0392B]"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : "-"}{formatZAR(tx.amount)}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[#A0AEC0]">
                        {formatDate(tx.date)}
                      </span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                        style={{
                          backgroundColor: status.bg,
                          color: status.text,
                        }}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
}