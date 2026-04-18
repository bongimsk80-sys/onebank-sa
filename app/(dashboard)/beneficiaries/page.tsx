"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import AddBeneficiaryForm from "@/components/beneficiaries/add-beneficiary-form";
import ExportButton from "@/components/shared/export-button";
import { exportBeneficiariesExcel, exportBeneficiariesPDF } from "@/lib/export";
import {
  Search,
  Plus,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react";

function formatZAR(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function maskAccount(account: string) {
  return account.substring(0, 6) + "..." + account.slice(-6);
}

const categoryIcons: Record<string, string> = {
  vendor: "🏢",
  supplier: "📦",
  employee: "👤",
  government: "🏛️",
  utility: "⚡",
};

const statusStyles: Record<string, { bg: string; text: string }> = {
  active: { bg: "#F0FDF4", text: "#27AE60" },
  pending: { bg: "#FFF7ED", text: "#E67E22" },
  disabled: { bg: "#F4F6F8", text: "#A0AEC0" },
};

const bankColors: Record<string, string> = {
  FNB: "#006B3C",
  "Standard Bank": "#0033A0",
  Absa: "#DC0032",
  Nedbank: "#007B40",
  Capitec: "#007DC5",
  HSBC: "#DB0011",
};

const statusFilters = ["Active", "Pending", "Disabled"];
const categories = ["All", "vendor", "supplier", "employee", "government", "utility"];
const banks = ["All", "FNB", "Standard Bank", "Absa", "Nedbank", "Capitec", "HSBC"];

export default function BeneficiariesPage() {
  const router = useRouter();
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("Active");
  const [activeType, setActiveType] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filter state
  const [filterBank, setFilterBank] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterMinPayments, setFilterMinPayments] = useState("");
  const [filterMaxPayments, setFilterMaxPayments] = useState("");

  async function fetchBeneficiaries() {
    try {
      const params = new URLSearchParams();
      params.set("status", activeStatus.toLowerCase());
      if (activeType !== "All") params.set("type", activeType.toLowerCase());
      const res = await fetch(`/api/beneficiaries?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBeneficiaries(data.beneficiaries ?? []);
    } catch (error) {
      console.error("Failed to fetch beneficiaries:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBeneficiaries();
  }, [activeStatus, activeType]);

  async function handleAddBeneficiary(form: any) {
    try {
      const res = await fetch("/api/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add beneficiary");
      setShowAddForm(false);
      setLoading(true);
      fetchBeneficiaries();
    } catch (error) {
      console.error("Failed to add beneficiary:", error);
    }
  }


  function clearFilters() {
    setFilterBank("All");
    setFilterCategory("All");
    setFilterMinPayments("");
    setFilterMaxPayments("");
  }

  const activeFilterCount = [
    filterBank !== "All",
    filterCategory !== "All",
    filterMinPayments !== "",
    filterMaxPayments !== "",
  ].filter(Boolean).length;

  const filtered = beneficiaries.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.tag.toLowerCase().includes(search.toLowerCase());
    const matchesBank = filterBank === "All" || b.bank === filterBank;
    const matchesCategory =
      filterCategory === "All" || b.category === filterCategory;
    const matchesMinPayments =
      filterMinPayments === "" || b.totalPayments >= Number(filterMinPayments);
    const matchesMaxPayments =
      filterMaxPayments === "" || b.totalPayments <= Number(filterMaxPayments);
    return (
      matchesSearch &&
      matchesBank &&
      matchesCategory &&
      matchesMinPayments &&
      matchesMaxPayments
    );
  });

  const counts = {
    local: beneficiaries.filter((b) => b.type === "local").length,
    international: beneficiaries.filter((b) => b.type === "international").length,
    wallet: beneficiaries.filter((b) => b.type === "wallet").length,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Status Tabs */}
      <div className="flex gap-2">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => { setActiveStatus(s); setLoading(true); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeStatus === s
                ? "bg-[#1B4332] text-white"
                : "bg-white text-[#718096] border border-[#E2E8F0]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Type Filter Pills */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { id: "All", label: "All", count: null },
          { id: "Local", label: "Local", count: counts.local },
          { id: "International", label: "International", count: counts.international },
          { id: "Wallet", label: "Wallet", count: counts.wallet },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => { setActiveType(id); setLoading(true); }}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full ${
              activeType === id
                ? "bg-[#D4A017] text-white"
                : "bg-white text-[#718096] border border-[#E2E8F0]"
            }`}
          >
            {label}
            {count !== null && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg ${
                activeType === id ? "bg-white text-[#D4A017]" : "bg-[#F4F6F8] text-[#718096]"
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AEC0]" />
        <Input
          placeholder="Search beneficiaries or tags..."
          className="pl-9 bg-white border-[#E2E8F0] rounded-xl text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#718096]">
          {loading ? "Loading..." : `${filtered.length} beneficiar${filtered.length !== 1 ? "ies" : "y"}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
              showFilterPanel || activeFilterCount > 0
                ? "bg-[#1B4332] text-white border-[#1B4332]"
                : "bg-white text-[#718096] border-[#E2E8F0]"
            }`}
          >
            <SlidersHorizontal size={13} />
            Filter
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#D4A017] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <ExportButton
            onExportPDF={() => exportBeneficiariesPDF(filtered)}
            onExportExcel={() => exportBeneficiariesExcel(filtered)}
          />
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[#1A202C] uppercase tracking-wide">
              Filters
            </p>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-[#C0392B] font-semibold hover:underline"
                >
                  Clear all
                </button>
              )}
              <button onClick={() => setShowFilterPanel(false)}>
                <X size={14} className="text-[#A0AEC0]" />
              </button>
            </div>
          </div>

          {/* Filter by Bank */}
          <div>
            <p className="text-xs font-semibold text-[#718096] mb-2 uppercase tracking-wide">
              Bank
            </p>
            <div className="flex flex-wrap gap-2">
              {banks.map((bank) => (
                <button
                  key={bank}
                  onClick={() => setFilterBank(bank)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    filterBank === bank
                      ? "bg-[#1B4332] text-white"
                      : "bg-[#F4F6F8] text-[#718096]"
                  }`}
                >
                  {bank}
                </button>
              ))}
            </div>
          </div>

          {/* Filter by Category */}
          <div>
            <p className="text-xs font-semibold text-[#718096] mb-2 uppercase tracking-wide">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                    filterCategory === cat
                      ? "bg-[#1B4332] text-white"
                      : "bg-[#F4F6F8] text-[#718096]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Filter by Payment Count */}
          <div>
            <p className="text-xs font-semibold text-[#718096] mb-2 uppercase tracking-wide">
              Payment Count Range
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[#A0AEC0] mb-1 block">Min payments</label>
                <Input
                  type="number"
                  placeholder="e.g. 10"
                  value={filterMinPayments}
                  onChange={(e) => setFilterMinPayments(e.target.value)}
                  className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-xs h-9"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#A0AEC0] mb-1 block">Max payments</label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={filterMaxPayments}
                  onChange={(e) => setFilterMaxPayments(e.target.value)}
                  className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-xs h-9"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Beneficiaries List */}
      <Card className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm divide-y divide-[#E2E8F0]">
        {loading ? (
          <div className="py-12 text-center text-sm text-[#A0AEC0]">
            Loading beneficiaries...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#A0AEC0]">
            No beneficiaries found
          </div>
        ) : (
          filtered.map((b) => {
            const status = statusStyles[b.status] ?? statusStyles.active;
            return (
              <div
                key={b.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-[#F4F6F8] transition-colors cursor-pointer"
                onClick={() => router.push(`/beneficiaries/${b.id}`)}
              >
                {/* Left */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#1B4332] flex items-center justify-center text-lg flex-shrink-0">
                    {categoryIcons[b.category] ?? "🏢"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#1A202C] truncate">
                        {b.name}
                      </p>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0"
                        style={{ backgroundColor: status.bg, color: status.text }}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-[#A0AEC0]">
                        {maskAccount(b.accountNumber)}
                      </span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white flex-shrink-0"
                        style={{ backgroundColor: bankColors[b.bank] ?? "#718096" }}
                      >
                        {b.bank}
                      </span>
                      <Badge className="bg-[#F4F6F8] text-[#718096] border-0 text-[10px] px-1.5 py-0 h-4">
                        {b.tag}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1A202C]">{b.totalPayments}</p>
                    <p className="text-[10px] text-[#A0AEC0]">payments</p>
                  </div>
                  <ChevronRight size={14} className="text-[#A0AEC0]" />
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 w-14 h-14 bg-[#D4A017] rounded-full shadow-lg flex items-center justify-center hover:bg-[#A07810] transition-colors z-50"
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* Add Beneficiary Form */}
      {showAddForm && (
        <AddBeneficiaryForm
          onClose={() => setShowAddForm(false)}
          onSuccess={handleAddBeneficiary}
        />
      )}
    </div>
  );
}