import { captureChartAsImage } from "@/lib/capture-chart";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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

// ─── PDF EXPORTS ────────────────────────────────────────────

export function exportTransactionsPDF(transactions: any[]) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("OneBank South Africa", 14, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Transaction Statement", 14, 22);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 140, 22);

  // Summary
  doc.setTextColor(26, 32, 44);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, 42);

  const credits = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const debits = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total Transactions: ${transactions.length}`, 14, 50);
  doc.text(`Total Credits: ${formatZAR(credits)}`, 14, 57);
  doc.text(`Total Debits: ${formatZAR(debits)}`, 14, 64);
  doc.text(`Net Position: ${formatZAR(credits - debits)}`, 14, 71);

  // Table
  autoTable(doc, {
    startY: 80,
    head: [["Date", "Name", "Type", "Bank", "Reference", "Status", "Amount"]],
    body: transactions.map((t) => [
      formatDate(t.date),
      t.name,
      t.type,
      t.bank,
      t.reference,
      t.status,
      formatZAR(t.amount),
    ]),
    headStyles: {
      fillColor: [27, 67, 50],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [244, 246, 248] },
    columnStyles: {
      6: { halign: "right" },
    },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 174, 192);
    doc.text(
      `OneBank South Africa • Confidential • Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`onebank-transactions-${Date.now()}.pdf`);
}

export function exportPaymentsPDF(payments: any[]) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("OneBank South Africa", 14, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Payments Report", 14, 22);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 140, 22);

  // Summary
  doc.setTextColor(26, 32, 44);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, 42);

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const pending = payments.filter((p) => p.status === "pending").length;
  const approved = payments.filter((p) => p.status === "approved").length;
  const settled = payments.filter((p) => p.status === "settled").length;
  const rejected = payments.filter((p) => p.status === "rejected").length;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total Payments: ${payments.length}`, 14, 50);
  doc.text(`Total Value: ${formatZAR(totalAmount)}`, 14, 57);
  doc.text(`Pending: ${pending} | Approved: ${approved} | Settled: ${settled} | Rejected: ${rejected}`, 14, 64);

  // Table
  autoTable(doc, {
    startY: 75,
    head: [["Date", "Beneficiary", "Bank", "Type", "Reference", "Status", "Amount"]],
    body: payments.map((p) => [
      formatDate(p.date),
      p.beneficiary,
      p.bank,
      p.type,
      p.reference,
      p.status,
      formatZAR(p.amount),
    ]),
    headStyles: {
      fillColor: [27, 67, 50],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [244, 246, 248] },
    columnStyles: {
      6: { halign: "right" },
    },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 174, 192);
    doc.text(
      `OneBank South Africa • Confidential • Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`onebank-payments-${Date.now()}.pdf`);
}

// ─── EXCEL EXPORTS ───────────────────────────────────────────

export function exportTransactionsExcel(transactions: any[]) {
  const data = transactions.map((t) => ({
    Date: formatDate(t.date),
    Name: t.name,
    Type: t.type,
    Bank: t.bank,
    "Account Number": t.accountNumber,
    Reference: t.reference,
    Status: t.status,
    Amount: t.amount,
    "Amount (ZAR)": formatZAR(t.amount),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  // Column widths
  ws["!cols"] = [
    { wch: 12 }, { wch: 30 }, { wch: 15 },
    { wch: 15 }, { wch: 20 }, { wch: 20 },
    { wch: 12 }, { wch: 12 }, { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Transactions");

  // Summary sheet
  const credits = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const debits = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const summary = [
    { Metric: "Total Transactions", Value: transactions.length },
    { Metric: "Total Credits", Value: formatZAR(credits) },
    { Metric: "Total Debits", Value: formatZAR(debits) },
    { Metric: "Net Position", Value: formatZAR(credits - debits) },
    { Metric: "Generated On", Value: formatDate(new Date().toISOString()) },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summary);
  wsSummary["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  XLSX.writeFile(wb, `onebank-transactions-${Date.now()}.xlsx`);
}

export function exportPaymentsExcel(payments: any[]) {
  const data = payments.map((p) => ({
    Date: formatDate(p.date),
    Beneficiary: p.beneficiary,
    Bank: p.bank,
    Type: p.type,
    Reference: p.reference,
    Description: p.description,
    Status: p.status,
    Priority: p.priority ? "Yes" : "No",
    Amount: p.amount,
    "Amount (ZAR)": formatZAR(p.amount),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  ws["!cols"] = [
    { wch: 12 }, { wch: 25 }, { wch: 15 },
    { wch: 15 }, { wch: 20 }, { wch: 35 },
    { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Payments");

  // Summary sheet
  const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
  const summary = [
    { Metric: "Total Payments", Value: payments.length },
    { Metric: "Total Value", Value: formatZAR(totalAmount) },
    { Metric: "Pending", Value: payments.filter((p) => p.status === "pending").length },
    { Metric: "Approved", Value: payments.filter((p) => p.status === "approved").length },
    { Metric: "Settled", Value: payments.filter((p) => p.status === "settled").length },
    { Metric: "Rejected", Value: payments.filter((p) => p.status === "rejected").length },
    { Metric: "Scheduled", Value: payments.filter((p) => p.status === "scheduled").length },
    { Metric: "Generated On", Value: formatDate(new Date().toISOString()) },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summary);
  wsSummary["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  XLSX.writeFile(wb, `onebank-payments-${Date.now()}.xlsx`);
}

export function exportBeneficiariesExcel(beneficiaries: any[]) {
  const data = beneficiaries.map((b) => ({
    Name: b.name,
    Type: b.type,
    Category: b.category,
    Status: b.status,
    Bank: b.bank,
    "Account Number": b.accountNumber,
    "Branch Code": b.branchCode,
    Tag: b.tag,
    "Total Payments": b.totalPayments,
    "Last Payment": formatZAR(b.lastPayment),
    "Last Payment Date": b.lastPaymentDate ? formatDate(b.lastPaymentDate) : "N/A",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  ws["!cols"] = [
    { wch: 25 }, { wch: 15 }, { wch: 15 },
    { wch: 12 }, { wch: 15 }, { wch: 25 },
    { wch: 12 }, { wch: 15 }, { wch: 15 },
    { wch: 18 }, { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Beneficiaries");
  XLSX.writeFile(wb, `onebank-beneficiaries-${Date.now()}.xlsx`);
}

export function exportBeneficiariesPDF(beneficiaries: any[]) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("OneBank South Africa", 14, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Beneficiaries Report", 14, 22);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 140, 22);

  // Summary
  doc.setTextColor(26, 32, 44);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, 42);

  const active = beneficiaries.filter((b) => b.status === "active").length;
  const pending = beneficiaries.filter((b) => b.status === "pending").length;
  const disabled = beneficiaries.filter((b) => b.status === "disabled").length;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total Beneficiaries: ${beneficiaries.length}`, 14, 50);
  doc.text(`Active: ${active} | Pending: ${pending} | Disabled: ${disabled}`, 14, 57);

  // Table
  autoTable(doc, {
    startY: 68,
    head: [["Name", "Type", "Category", "Bank", "Account", "Tag", "Status", "Payments"]],
    body: beneficiaries.map((b) => [
      b.name,
      b.type,
      b.category,
      b.bank,
      b.accountNumber.substring(0, 6) + "..." + b.accountNumber.slice(-6),
      b.tag,
      b.status,
      b.totalPayments,
    ]),
    headStyles: {
      fillColor: [27, 67, 50],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [244, 246, 248] },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 174, 192);
    doc.text(
      `OneBank South Africa • Confidential • Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`onebank-beneficiaries-${Date.now()}.pdf`);
}

export function exportAnalyticsPDF(data: any) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("OneBank South Africa", 14, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Analytics Report", 14, 22);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 140, 22);

  // Summary Cards
  doc.setTextColor(26, 32, 44);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Financial Summary", 14, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total Balance: ${formatZAR(data.summary?.totalBalance ?? 0)}`, 14, 52);
  doc.text(`Total Credits: ${formatZAR(data.summary?.totalCredits ?? 0)}`, 14, 59);
  doc.text(`Total Debits: ${formatZAR(data.summary?.totalDebits ?? 0)}`, 14, 66);
  doc.text(`Total Payments: ${data.summary?.totalPayments ?? 0}`, 14, 73);
  doc.text(`Total Transactions: ${data.summary?.totalTransactions ?? 0}`, 14, 80);

  // Bank Balances Table
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Balance by Bank", 14, 95);

  autoTable(doc, {
    startY: 100,
    head: [["Bank", "Balance (ZAR)", "% of Total", "Payments"]],
    body: (data.bankBalances ?? []).map((b: any) => {
      const total = (data.bankBalances ?? []).reduce(
        (s: number, x: any) => s + x.value,
        0
      );
      return [
        b.name,
        formatZAR(b.value),
        `${((b.value / total) * 100).toFixed(1)}%`,
        b.payments,
      ];
    }),
    headStyles: {
      fillColor: [27, 67, 50],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [244, 246, 248] },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
  });

  // Payment Status Table
  const afterBankTable = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Payments by Status", 14, afterBankTable);

  autoTable(doc, {
    startY: afterBankTable + 5,
    head: [["Status", "Count", "% of Total"]],
    body: (data.statusBreakdown ?? []).map((s: any) => {
      const total = (data.statusBreakdown ?? []).reduce(
        (sum: number, x: any) => sum + x.value,
        0
      );
      return [
        s.name,
        s.value,
        total > 0 ? `${((s.value / total) * 100).toFixed(1)}%` : "0%",
      ];
    }),
    headStyles: {
      fillColor: [27, 67, 50],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [244, 246, 248] },
  });

  // Cash Flow Table
  const afterStatusTable = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Cash Flow — Last 6 Months", 14, afterStatusTable);

  autoTable(doc, {
    startY: afterStatusTable + 5,
    head: [["Month", "Credits (ZAR)", "Debits (ZAR)", "Net (ZAR)"]],
    body: (data.monthlyFlow ?? []).map((m: any) => [
      m.month,
      formatZAR(m.credits),
      formatZAR(m.debits),
      formatZAR(m.credits - m.debits),
    ]),
    headStyles: {
      fillColor: [27, 67, 50],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [244, 246, 248] },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 174, 192);
    doc.text(
      `OneBank South Africa • Confidential • Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`onebank-analytics-${Date.now()}.pdf`);
}

export function exportAnalyticsExcel(data: any) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summary = [
    { Metric: "Total Balance", Value: formatZAR(data.summary?.totalBalance ?? 0) },
    { Metric: "Total Credits", Value: formatZAR(data.summary?.totalCredits ?? 0) },
    { Metric: "Total Debits", Value: formatZAR(data.summary?.totalDebits ?? 0) },
    { Metric: "Total Payments", Value: data.summary?.totalPayments ?? 0 },
    { Metric: "Total Transactions", Value: data.summary?.totalTransactions ?? 0 },
    { Metric: "Generated On", Value: formatDate(new Date().toISOString()) },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summary);
  wsSummary["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Bank Balances sheet
  const total = (data.bankBalances ?? []).reduce(
    (s: number, b: any) => s + b.value, 0
  );
  const bankData = (data.bankBalances ?? []).map((b: any) => ({
    Bank: b.name,
    "Balance (ZAR)": formatZAR(b.value),
    "% of Total": `${((b.value / total) * 100).toFixed(1)}%`,
    Payments: b.payments,
  }));
  const wsBanks = XLSX.utils.json_to_sheet(bankData);
  wsBanks["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsBanks, "Balance by Bank");

  // Payment Status sheet
  const statusTotal = (data.statusBreakdown ?? []).reduce(
    (s: number, x: any) => s + x.value, 0
  );
  const statusData = (data.statusBreakdown ?? []).map((s: any) => ({
    Status: s.name,
    Count: s.value,
    "% of Total": statusTotal > 0
      ? `${((s.value / statusTotal) * 100).toFixed(1)}%`
      : "0%",
  }));
  const wsStatus = XLSX.utils.json_to_sheet(statusData);
  wsStatus["!cols"] = [{ wch: 15 }, { wch: 10 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsStatus, "Payments by Status");

  // Cash Flow sheet
  const cashFlowData = (data.monthlyFlow ?? []).map((m: any) => ({
    Month: m.month,
    "Credits (ZAR)": formatZAR(m.credits),
    "Debits (ZAR)": formatZAR(m.debits),
    "Net (ZAR)": formatZAR(m.credits - m.debits),
  }));
  const wsCashFlow = XLSX.utils.json_to_sheet(cashFlowData);
  wsCashFlow["!cols"] = [
    { wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCashFlow, "Cash Flow");

  XLSX.writeFile(wb, `onebank-analytics-${Date.now()}.xlsx`);
}
export async function exportByBankPDF(
  bankBalances: any[],
  chartElement?: HTMLElement | null
) {
  const doc = new jsPDF();

  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("OneBank South Africa", 14, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Balance by Bank Report", 14, 22);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 140, 22);

  const total = bankBalances.reduce((s, b) => s + b.value, 0);

  doc.setTextColor(26, 32, 44);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total Balance: ${formatZAR(total)}`, 14, 50);
  doc.text(`Number of Banks: ${bankBalances.length}`, 14, 57);

  // Embed chart image
  let chartStartY = 68;
  if (chartElement) {
    const imgData = await captureChartAsImage(chartElement);
    if (imgData) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 32, 44);
      doc.text("Balance Distribution Chart", 14, 67);
      doc.addImage(imgData, "PNG", 14, 72, 182, 80);
      chartStartY = 162;
    }
  }

  autoTable(doc, {
    startY: chartStartY,
    head: [["Bank", "Balance (ZAR)", "% of Total", "Payments"]],
    body: bankBalances.map((b) => [
      b.name,
      formatZAR(b.value),
      `${((b.value / total) * 100).toFixed(1)}%`,
      b.payments,
    ]),
    headStyles: { fillColor: [27, 67, 50], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [244, 246, 248] },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 174, 192);
    doc.text(`OneBank South Africa • Confidential • Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
  }

  doc.save(`onebank-by-bank-${Date.now()}.pdf`);
}

export function exportByBankExcel(bankBalances: any[]) {
  const total = bankBalances.reduce((s, b) => s + b.value, 0);
  const data = bankBalances.map((b) => ({
    Bank: b.name,
    "Balance (ZAR)": formatZAR(b.value),
    "Raw Balance": b.value,
    "% of Total": `${((b.value / total) * 100).toFixed(1)}%`,
    Payments: b.payments,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Balance by Bank");
  XLSX.writeFile(wb, `onebank-by-bank-${Date.now()}.xlsx`);
}

export async function exportByStatusPDF(
  statusBreakdown: any[],
  chartElement?: HTMLElement | null
) {
  const doc = new jsPDF();

  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("OneBank South Africa", 14, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Payments by Status Report", 14, 22);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 140, 22);

  const total = statusBreakdown.reduce((s, x) => s + x.value, 0);

  doc.setTextColor(26, 32, 44);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total Payments: ${total}`, 14, 50);

  let chartStartY = 62;
  if (chartElement) {
    const imgData = await captureChartAsImage(chartElement);
    if (imgData) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 32, 44);
      doc.text("Status Distribution Chart", 14, 61);
      doc.addImage(imgData, "PNG", 14, 66, 182, 80);
      chartStartY = 156;
    }
  }

  autoTable(doc, {
    startY: chartStartY,
    head: [["Status", "Count", "% of Total"]],
    body: statusBreakdown.map((s) => [
      s.name,
      s.value,
      total > 0 ? `${((s.value / total) * 100).toFixed(1)}%` : "0%",
    ]),
    headStyles: { fillColor: [27, 67, 50], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [244, 246, 248] },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 174, 192);
    doc.text(`OneBank South Africa • Confidential • Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
  }

  doc.save(`onebank-by-status-${Date.now()}.pdf`);
}

export function exportByStatusExcel(statusBreakdown: any[]) {
  const total = statusBreakdown.reduce((s, x) => s + x.value, 0);
  const data = statusBreakdown.map((s) => ({
    Status: s.name,
    Count: s.value,
    "% of Total": total > 0 ? `${((s.value / total) * 100).toFixed(1)}%` : "0%",
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 15 }, { wch: 10 }, { wch: 15 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Payments by Status");
  XLSX.writeFile(wb, `onebank-by-status-${Date.now()}.xlsx`);
}

export async function exportByCategoryPDF(
  categoryBreakdown: any[],
  chartElement?: HTMLElement | null
) {
  const doc = new jsPDF();

  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("OneBank South Africa", 14, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Payments by Category Report", 14, 22);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 140, 22);

  const total = categoryBreakdown.reduce((s, x) => s + x.value, 0);

  doc.setTextColor(26, 32, 44);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total Value: ${formatZAR(total)}`, 14, 50);

  let chartStartY = 62;
  if (chartElement) {
    const imgData = await captureChartAsImage(chartElement);
    if (imgData) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 32, 44);
      doc.text("Category Distribution Chart", 14, 61);
      doc.addImage(imgData, "PNG", 14, 66, 182, 80);
      chartStartY = 156;
    }
  }

  autoTable(doc, {
    startY: chartStartY,
    head: [["Category", "Amount (ZAR)", "% of Total"]],
    body: categoryBreakdown.map((c) => [
      c.name,
      formatZAR(c.value),
      total > 0 ? `${((c.value / total) * 100).toFixed(1)}%` : "0%",
    ]),
    headStyles: { fillColor: [27, 67, 50], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [244, 246, 248] },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 174, 192);
    doc.text(`OneBank South Africa • Confidential • Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
  }

  doc.save(`onebank-by-category-${Date.now()}.pdf`);
}

export function exportByCategoryExcel(categoryBreakdown: any[]) {
  const total = categoryBreakdown.reduce((s, x) => s + x.value, 0);
  const data = categoryBreakdown.map((c) => ({
    Category: c.name,
    "Amount (ZAR)": formatZAR(c.value),
    "Raw Amount": c.value,
    "% of Total": total > 0 ? `${((c.value / total) * 100).toFixed(1)}%` : "0%",
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 15 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Payments by Category");
  XLSX.writeFile(wb, `onebank-by-category-${Date.now()}.xlsx`);
}

export async function exportCashFlowPDF(
  monthlyFlow: any[],
  chartElement?: HTMLElement | null
) {
  const doc = new jsPDF();

  doc.setFillColor(27, 67, 50);
  doc.rect(0, 0, 210, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("OneBank South Africa", 14, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Cash Flow Report — Last 6 Months", 14, 22);
  doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 140, 22);

  const totalCredits = monthlyFlow.reduce((s, m) => s + m.credits, 0);
  const totalDebits = monthlyFlow.reduce((s, m) => s + m.debits, 0);

  doc.setTextColor(26, 32, 44);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total Credits: ${formatZAR(totalCredits)}`, 14, 50);
  doc.text(`Total Debits: ${formatZAR(totalDebits)}`, 14, 57);
  doc.text(`Net Position: ${formatZAR(totalCredits - totalDebits)}`, 14, 64);

  let chartStartY = 75;
  if (chartElement) {
    const imgData = await captureChartAsImage(chartElement);
    if (imgData) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 32, 44);
      doc.text("Cash Flow Chart", 14, 74);
      doc.addImage(imgData, "PNG", 14, 79, 182, 80);
      chartStartY = 169;
    }
  }

  autoTable(doc, {
    startY: chartStartY,
    head: [["Month", "Credits (ZAR)", "Debits (ZAR)", "Net (ZAR)"]],
    body: monthlyFlow.map((m) => [
      m.month,
      formatZAR(m.credits),
      formatZAR(m.debits),
      formatZAR(m.credits - m.debits),
    ]),
    headStyles: { fillColor: [27, 67, 50], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [244, 246, 248] },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 174, 192);
    doc.text(`OneBank South Africa • Confidential • Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
  }

  doc.save(`onebank-cashflow-${Date.now()}.pdf`);
}

export function exportCashFlowExcel(monthlyFlow: any[]) {
  const data = monthlyFlow.map((m) => ({
    Month: m.month,
    "Credits (ZAR)": formatZAR(m.credits),
    "Raw Credits": m.credits,
    "Debits (ZAR)": formatZAR(m.debits),
    "Raw Debits": m.debits,
    "Net (ZAR)": formatZAR(m.credits - m.debits),
    "Raw Net": m.credits - m.debits,
  }));

  const totalCredits = monthlyFlow.reduce((s, m) => s + m.credits, 0);
  const totalDebits = monthlyFlow.reduce((s, m) => s + m.debits, 0);

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 10 }, { wch: 18 }, { wch: 15 },
    { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 15 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cash Flow");

  const summary = [
    { Metric: "Total Credits", Value: formatZAR(totalCredits) },
    { Metric: "Total Debits", Value: formatZAR(totalDebits) },
    { Metric: "Net Position", Value: formatZAR(totalCredits - totalDebits) },
    { Metric: "Generated On", Value: formatDate(new Date().toISOString()) },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summary);
  wsSummary["!cols"] = [{ wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  XLSX.writeFile(wb, `onebank-cashflow-${Date.now()}.xlsx`);
}