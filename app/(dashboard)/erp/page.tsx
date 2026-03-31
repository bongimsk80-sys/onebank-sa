"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Zap,
  Link,
  FileText,
  ChevronRight,
  Building2,
} from "lucide-react";

function formatZAR(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const erpProviders = [
  {
    id: "sage",
    name: "Sage",
    logo: "🟩",
    description: "Most popular ERP in SA SMEs",
    color: "#00B050",
  },
  {
    id: "sap",
    name: "SAP",
    logo: "🔷",
    description: "Enterprise resource planning",
    color: "#0070F2",
  },
  {
    id: "oracle",
    name: "Oracle",
    logo: "🔴",
    description: "Oracle Financials Cloud",
    color: "#CC0000",
  },
  {
    id: "dynamics",
    name: "Microsoft Dynamics",
    logo: "🟦",
    description: "Microsoft business solutions",
    color: "#0078D4",
  },
  {
    id: "xero",
    name: "Xero",
    logo: "🔵",
    description: "Cloud accounting software",
    color: "#13B5EA",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    logo: "🟢",
    description: "Small business accounting",
    color: "#2CA01C",
  },
];

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  connected: { bg: "#F0FDF4", text: "#27AE60", label: "Connected" },
  disconnected: { bg: "#F4F6F8", text: "#A0AEC0", label: "Disconnected" },
  error: { bg: "#FFF1F2", text: "#C0392B", label: "Error" },
  syncing: { bg: "#EFF6FF", text: "#2980B9", label: "Syncing" },
};

const invoiceStatusConfig: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FFF7ED", text: "#E67E22" },
  payment_created: { bg: "#F0FDF4", text: "#27AE60" },
  paid: { bg: "#EFF6FF", text: "#2980B9" },
  overdue: { bg: "#FFF1F2", text: "#C0392B" },
};

export default function ErpPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("connections");
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [form, setForm] = useState({ apiKey: "", apiUrl: "" });
  const [invoiceForm, setInvoiceForm] = useState({
    erpProvider: "sage",
    invoiceNumber: "",
    vendor: "",
    amount: "",
    dueDate: "",
    autoCreatePayment: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [connRes, invRes] = await Promise.all([
        fetch("/api/erp"),
        fetch("/api/erp/invoices"),
      ]);
      const connData = await connRes.json();
      const invData = await invRes.json();
      setConnections(connData.connections ?? []);
      setInvoices(invData.invoices ?? []);
    } catch (error) {
      console.error("Failed to fetch ERP data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    if (!selectedProvider) return;
    try {
      await fetch("/api/erp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedProvider.name,
          provider: selectedProvider.id,
          apiKey: form.apiKey,
          apiUrl: form.apiUrl,
        }),
      });
      setShowConnectForm(false);
      setForm({ apiKey: "", apiUrl: "" });
      fetchData();
    } catch (error) {
      console.error("Failed to connect ERP:", error);
    }
  }

  async function handleSync(id: string) {
    setSyncing(id);
    await new Promise((r) => setTimeout(r, 2000));
    await fetch("/api/erp", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "connected" }),
    });
    setSyncing(null);
    fetchData();
  }

  async function handleDisconnect(id: string) {
    await fetch("/api/erp", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "disconnected" }),
    });
    fetchData();
  }

  async function handleCreateInvoice() {
    try {
      await fetch("/api/erp/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invoiceForm,
          amount: Number(invoiceForm.amount),
        }),
      });
      setShowInvoiceForm(false);
      setInvoiceForm({
        erpProvider: "sage",
        invoiceNumber: "",
        vendor: "",
        amount: "",
        dueDate: "",
        autoCreatePayment: true,
      });
      fetchData();
    } catch (error) {
      console.error("Failed to create invoice:", error);
    }
  }

  const connectedCount = connections.filter(
    (c) => c.status === "connected"
  ).length;

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Connected ERPs", value: connectedCount, color: "#27AE60", bg: "#F0FDF4" },
          { label: "Total ERPs", value: connections.length, color: "#1B4332", bg: "#F4F6F8" },
          { label: "Invoices", value: invoices.length, color: "#2980B9", bg: "#EFF6FF" },
        ].map(({ label, value, color, bg }) => (
          <Card
            key={label}
            className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm text-center"
          >
            <p className="text-xl font-bold" style={{ color }}>
              {String(value).padStart(2, "0")}
            </p>
            <p className="text-[10px] text-[#718096] mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {["connections", "invoices", "providers"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              activeTab === tab
                ? "bg-[#1B4332] text-white"
                : "bg-white text-[#718096] border border-[#E2E8F0]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Connections Tab */}
      {activeTab === "connections" && (
        <div className="space-y-4">
          {connections.length === 0 ? (
            <Card className="p-8 rounded-xl border border-[#E2E8F0] bg-white shadow-sm text-center">
              <Link size={32} className="text-[#A0AEC0] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#1A202C]">
                No ERP connections yet
              </p>
              <p className="text-xs text-[#718096] mt-1">
                Connect your ERP system to sync invoices and payments
              </p>
              <button
                onClick={() => setActiveTab("providers")}
                className="mt-4 px-4 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-semibold"
              >
                Browse Providers
              </button>
            </Card>
          ) : (
            <Card className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm divide-y divide-[#E2E8F0]">
              {connections.map((conn) => {
                const status = statusConfig[conn.status] ?? statusConfig.disconnected;
                const isSyncing = syncing === conn.id;
                return (
                  <div key={conn.id} className="px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F4F6F8] flex items-center justify-center text-xl">
                          {erpProviders.find((p) => p.id === conn.provider)?.logo ?? "🔗"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#1A202C]">
                            {conn.name}
                          </p>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                            style={{ backgroundColor: status.bg, color: status.text }}
                          >
                            {isSyncing ? "Syncing..." : status.label}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-[#A0AEC0]" />
                    </div>

                    {conn.lastSyncedAt && (
                      <p className="text-[10px] text-[#A0AEC0] mb-3">
                        Last synced: {formatDate(conn.lastSyncedAt)}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSync(conn.id)}
                        disabled={isSyncing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#F4F6F8] text-xs font-semibold text-[#1B4332] hover:bg-[#E2E8F0] transition-colors disabled:opacity-60"
                      >
                        <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "Syncing..." : "Sync Now"}
                      </button>
                      <button
                        onClick={() => handleDisconnect(conn.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#FFF1F2] text-xs font-semibold text-[#C0392B] hover:bg-[#FFE0E0] transition-colors"
                      >
                        <XCircle size={12} />
                        Disconnect
                      </button>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowInvoiceForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B4332] text-white text-xs font-semibold"
            >
              <Plus size={14} />
              Import Invoice
            </button>
          </div>

          {invoices.length === 0 ? (
            <Card className="p-8 rounded-xl border border-[#E2E8F0] bg-white shadow-sm text-center">
              <FileText size={32} className="text-[#A0AEC0] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#1A202C]">
                No invoices imported yet
              </p>
              <p className="text-xs text-[#718096] mt-1">
                Import invoices from your ERP to create automatic payments
              </p>
            </Card>
          ) : (
            <Card className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm divide-y divide-[#E2E8F0]">
              {invoices.map((invoice) => {
                const status = invoiceStatusConfig[invoice.status] ?? invoiceStatusConfig.pending;
                return (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#F4F6F8] flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-[#718096]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1A202C] truncate">
                          {invoice.vendor}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-[#A0AEC0]">
                            {invoice.invoiceNumber}
                          </span>
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                            style={{ backgroundColor: status.bg, color: status.text }}
                          >
                            {invoice.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-bold text-[#1A202C]">
                        {formatZAR(invoice.amount)}
                      </p>
                      <p className="text-[10px] text-[#A0AEC0]">
                        Due {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      )}

      {/* Providers Tab */}
      {activeTab === "providers" && (
        <div className="grid grid-cols-2 gap-3">
          {erpProviders.map((provider) => {
            const isConnected = connections.some(
              (c) => c.provider === provider.id && c.status === "connected"
            );
            return (
              <Card
                key={provider.id}
                className="p-4 rounded-xl border border-[#E2E8F0] bg-white shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{provider.logo}</span>
                  {isConnected && (
                    <CheckCircle size={16} className="text-[#27AE60]" />
                  )}
                </div>
                <p className="text-sm font-bold text-[#1A202C]">
                  {provider.name}
                </p>
                <p className="text-[10px] text-[#718096] mt-0.5 mb-3">
                  {provider.description}
                </p>
                <button
                  onClick={() => {
                    setSelectedProvider(provider);
                    setShowConnectForm(true);
                  }}
                  disabled={isConnected}
                  className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                    isConnected
                      ? "bg-[#F0FDF4] text-[#27AE60] cursor-default"
                      : "bg-[#1B4332] text-white hover:bg-[#2D6A4F]"
                  }`}
                >
                  {isConnected ? "Connected" : "Connect"}
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Connect ERP Modal */}
      {showConnectForm && selectedProvider && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-white w-full lg:max-w-md rounded-t-3xl lg:rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedProvider.logo}</span>
                <div>
                  <h2 className="text-base font-bold text-[#1A202C]">
                    Connect {selectedProvider.name}
                  </h2>
                  <p className="text-xs text-[#718096]">
                    {selectedProvider.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConnectForm(false)}
                className="w-8 h-8 rounded-full bg-[#F4F6F8] flex items-center justify-center"
              >
                <XCircle size={16} className="text-[#718096]" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-[#27AE60]" />
                  <p className="text-xs font-semibold text-[#27AE60]">
                    Demo Mode
                  </p>
                </div>
                <p className="text-xs text-[#718096]">
                  Enter any values for demo purposes. Real integration requires valid credentials.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  API Key
                </label>
                <Input
                  placeholder={`${selectedProvider.name} API key`}
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  API URL
                </label>
                <Input
                  placeholder={`https://api.${selectedProvider.id}.com`}
                  value={form.apiUrl}
                  onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
                  className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-3">
              <button
                onClick={() => setShowConnectForm(false)}
                className="flex-1 h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#718096]"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                className="flex-1 h-11 rounded-xl bg-[#1B4332] text-white text-sm font-semibold"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Invoice Modal */}
      {showInvoiceForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
          <div className="bg-white w-full lg:max-w-md rounded-t-3xl lg:rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-base font-bold text-[#1A202C]">
                Import Invoice
              </h2>
              <button
                onClick={() => setShowInvoiceForm(false)}
                className="w-8 h-8 rounded-full bg-[#F4F6F8] flex items-center justify-center"
              >
                <XCircle size={16} className="text-[#718096]" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh] px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  ERP Provider
                </label>
                <select
                  value={invoiceForm.erpProvider}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, erpProvider: e.target.value })
                  }
                  className="w-full h-11 px-3 rounded-xl border border-[#E2E8F0] bg-[#F4F6F8] text-sm text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                >
                  {erpProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Invoice Number
                </label>
                <Input
                  placeholder="INV-2026-001"
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })
                  }
                  className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Vendor Name
                </label>
                <Input
                  placeholder="Vendor or supplier name"
                  value={invoiceForm.vendor}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, vendor: e.target.value })
                  }
                  className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Amount (ZAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#718096]">
                    R
                  </span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={invoiceForm.amount}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, amount: e.target.value })
                    }
                    className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11 pl-7"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#718096] uppercase tracking-wide mb-1.5 block">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="bg-[#F4F6F8] border-[#E2E8F0] rounded-xl text-sm h-11"
                />
              </div>

              {/* Auto Create Payment Toggle */}
              <div className="flex items-center justify-between py-3 border-t border-[#E2E8F0]">
                <div>
                  <p className="text-sm font-medium text-[#1A202C]">
                    Auto-create Payment
                  </p>
                  <p className="text-xs text-[#718096]">
                    Automatically create a payment request from this invoice
                  </p>
                </div>
                <button
                  onClick={() =>
                    setInvoiceForm({
                      ...invoiceForm,
                      autoCreatePayment: !invoiceForm.autoCreatePayment,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
                    invoiceForm.autoCreatePayment ? "bg-[#1B4332]" : "bg-[#E2E8F0]"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      invoiceForm.autoCreatePayment ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {invoiceForm.autoCreatePayment && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
                  <Zap size={14} className="text-[#2980B9] flex-shrink-0" />
                  <p className="text-xs text-[#2980B9]">
                    A payment request will be automatically created and added to the payments queue
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#E2E8F0] flex gap-3">
              <button
                onClick={() => setShowInvoiceForm(false)}
                className="flex-1 h-11 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-[#718096]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                className="flex-1 h-11 rounded-xl bg-[#1B4332] text-white text-sm font-semibold"
              >
                Import Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}