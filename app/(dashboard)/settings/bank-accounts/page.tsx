"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/store/session-store";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

function formatZAR(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
}

const banks = [
  { name: "FNB", color: "#006B3C" },
  { name: "Standard Bank", color: "#0033A0" },
  { name: "Absa", color: "#DC0032" },
  { name: "Nedbank", color: "#007B40" },
  { name: "Capitec", color: "#007DC5" },
];

const accountTypes = [
  "Business Cheque",
  "Business Current",
  "Business Savings",
  "Business Transmission",
];

export default function BankAccountsPage() {
  const router = useRouter();
  const { role } = useSessionStore();
  const isAdmin = role === "admin";
  const [accounts, setAccounts]     = useState<any[]>([]);
  const [accountLimit, setLimit]    = useState<number>(10);
  const [accountPlan, setPlan]      = useState<string>("beta");
  const [loading, setLoading]       = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [error, setError]           = useState("");
  const [form, setForm] = useState({
    bank: "",
    accountNumber: "",
    accountType: "Business Cheque",
    balance: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/accounts");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAccounts(data.accounts ?? []);
      if (data.limit !== undefined) setLimit(data.limit);
      if (data.plan  !== undefined) setPlan(data.plan);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    setError("");
    if (!form.bank || !form.accountNumber || !form.accountType) {
      setError("Please fill in all required fields.");
      return;
    }

    const bankColor = banks.find((b) => b.name === form.bank)?.color ?? "#718096";

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          balance: Number(form.balance) || 0,
          color: bankColor,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.detail ?? d.error ?? "Failed to add account. Please try again.");
        return;
      }
      setShowAddForm(false);
      setForm({ bank: "", accountNumber: "", accountType: "Business Cheque", balance: "" });
      fetchAccounts();
    } catch {
      setError("Failed to add account. Please try again.");
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    await fetch(`/api/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchAccounts();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to remove this bank account?")) return;
    await fetch(`/api/accounts/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchAccounts();
  }

  const totalBalance  = accounts.filter((a) => a.isActive).reduce((sum, a) => sum + a.balance, 0);
  const count         = accounts.length;
  const isUnlimited   = accountLimit === Infinity || accountLimit >= 999;
  const atLimit       = !isUnlimited && count >= accountLimit;
  const quotaPct      = isUnlimited ? 0 : Math.min((count / accountLimit) * 100, 100);
  const quotaColor    = quotaPct >= 100 ? "#C0392B" : quotaPct >= 80 ? "#D4A017" : "#1B4332";

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[#718096] hover:text-[#1B4332] transition-colors font-medium"
      >
        <ArrowLeft size={16} />
        Back to Settings
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#1A202C]">Bank Accounts</h2>
          <p className="text-xs text-[#718096] mt-0.5">
            Manage your connected SA bank accounts
          </p>
        </div>
        <button
          onClick={() => setShowBalances(!showBalances)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F4F6F8] text-xs font-semibold text-[#718096] hover:bg-[#E2E8F0] transition-colors"
        >
          {showBalances ? <EyeOff size={13} /> : <Eye size={13} />}
          {showBalances ? "Hide" : "Show"} Balances
        </button>
      </div>

      {/* Quota bar */}
      {!loading && (
        <Card className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#1A202C]">
              Connected accounts
            </span>
            <span className="text-xs font-bold" style={{ color: quotaColor }}>
              {isUnlimited ? `${count} — unlimited` : `${count} of ${accountLimit}`}
            </span>
          </div>
          {!isUnlimited && (
            <div className="w-full h-1.5 bg-[#F4F6F8] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${quotaPct}%`, backgroundColor: quotaColor }}
              />
            </div>
          )}
          <p className="text-[10px] text-[#A0AEC0] mt-1.5 capitalize">
            {accountPlan} plan
            {atLimit && (
              <span className="ml-1 font-semibold text-[#C0392B]">
                — limit reached
              </span>
            )}
          </p>
        </Card>
      )}

      {/* Total Balance Card */}
      <Card className="bg-[#1B4332] text-white p-5 rounded-2xl border-0 shadow-lg">
        <p className="text-xs uppercase tracking-widest text-[#A0C4B1] mb-1">
          Total Active Balance
        </p>
        <p className="text-2xl font-bold">
          {showBalances ? formatZAR(totalBalance) : "R ••••••••"}
        </p>
        <p className="text-xs text-[#A0C4B1] mt-1">
          Across {accounts.filter((a) => a.isActive).length} active accounts
        </p>
      </Card>

      {/* Accounts List */}
      <Card className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm divide-y divide-[#E2E8F0]">
        {loading ? (
          <div className="py-12 text-center text-sm text-[#A0AEC0]">
            Loading accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#A0AEC0]">
            No bank accounts connected
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Bank Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: account.color }}
                  >
                    {account.bank.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#1A202C]">
                        {account.bank}
                      </p>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          account.isActive
                            ? "bg-[#F0FDF4] text-[#27AE60]"
                            : "bg-[#F4F6F8] text-[#A0AEC0]"
                        }`}
                      >
                        {account.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-[#718096]">{account.accountType}</p>
                    <p className="text-[10px] text-[#A0AEC0] font-mono mt-0.5">
                      {account.accountNumber}
                    </p>
                  </div>
                </div>

                {/* Balance + Actions */}
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-bold text-[#1A202C]">
                    {showBalances ? formatZAR(account.balance) : "R ••••••"}
                  </p>
                  {isAdmin && (
                <div className="flex items-center gap-1 mt-2 justify-end">
                    <button
                      onClick={() => handleToggleActive(account.id, account.isActive)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        account.isActive
                          ? "bg-[#FFF1F2] hover:bg-[#FFC5C5]"
                          : "bg-[#F0FDF4] hover:bg-[#BBF7D0]"
                      }`}
                      title={account.isActive ? "Deactivate" : "Activate"}
                    >
                      {account.isActive ? (
                        <XCircle size={13} className="text-[#C0392B]" />
                      ) : (
                        <CheckCircle size={13} className="text-[#27AE60]" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="w-7 h-7 rounded-lg bg-[#FFF1F2] flex items-center justify-center hover:bg-[#FFC5C5] transition-colors"
                      title="Remove account"
                    >
                      <Trash2 size={13} className="text-[#C0392B]" />
                    </button>
                  </div>
                )}
                </div>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Add Account Button — admin only */}
      {isAdmin && !atLimit && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-[#E2E8F0] bg-white text-sm font-semibold text-[#1B4332] hover:border-[#1B4332] hover:bg-[#F0FDF4] transition-all"
        >
          <Plus size={16} />
          Add Bank Account
        </button>
      )}

      {/* Limit reached — upgrade prompt */}
      {isAdmin && atLimit && (
        <Card className="p-4 rounded-xl border border-[#FED7D7] bg-[#FFF5F5] shadow-sm">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FED7D7] flex items-center justify-center flex-shrink-0">
              <AlertCircle size={16} className="text-[#C0392B]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#C0392B] mb-0.5">
                Account limit reached ({accountLimit}/{accountLimit})
              </p>
              <p className="text-xs text-[#718096] leading-relaxed">
                Your <span className="font-semibold capitalize">{accountPlan}</span> plan
                allows up to {accountLimit} bank accounts. To connect more accounts,
                contact us to upgrade your plan.
              </p>
              <a
                href="mailto:hello@onebank.co.za?subject=Plan upgrade request"
                className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-[#1B4332] hover:underline"
              >
                Contact us to upgrade →
              </a>
            </div>
          </div>
        </Card>
      )}

      {/* Add Account Modal — admin only */}
      {isAdmin && showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-white w-full lg:max-w-md rounded-t-3xl lg:rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-base font-bold text-[#1A202C]">
                Add Bank Account
              </h2>
              <button
                onClick={() => { setShowAddForm(false); setError(""); }}
                className="w-8 h-8 rounded-full bg-[#F4F6F8] flex items-center justify-center"
              >
                <X size={16} className="text-[#718096]" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-[#FFF1F2] border border-[#FFC5C5] text-sm text-[#C0392B]">
                  {error}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Bank *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {banks.map((bank) => (
                    <button
                      key={bank.name}
                      onClick={() => setForm({ ...form, bank: bank.name })}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        form.bank === bank.name
                          ? "text-white border-transparent"
                          : "bg-[#F4F6F8] text-[#718096] border-transparent"
                      }`}
                      style={
                        form.bank === bank.name
                          ? { backgroundColor: bank.color }
                          : {}
                      }
                    >
                      {bank.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Account Number *
                </label>
                <Input
                  placeholder="e.g. 62123456789"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Account Type *
                </label>
                <select
                  value={form.accountType}
                  onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] bg-[#F4F6F8] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                >
                  {accountTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Opening Balance (ZAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#718096]">
                    R
                  </span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={form.balance}
                    onChange={(e) => setForm({ ...form, balance: e.target.value })}
                    className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11 pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-3">
              <button
                onClick={() => { setShowAddForm(false); setError(""); }}
                className="flex-1 h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#718096]"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 h-11 rounded-xl bg-[#1B4332] text-white text-sm font-semibold hover:bg-[#2D6A4F] transition-colors"
              >
                Add Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
