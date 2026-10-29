import type { BankConnector, ConnectorContext, ExternalAccount, ExternalTransaction } from "./types";

/**
 * Deterministic demo data. The same connection always produces the same
 * accounts and transactions, so syncing twice never creates duplicates and
 * demos are repeatable. Clearly labelled as simulated in the UI.
 */

const BANKS: { bank: string; type: string; prefix: string }[] = [
  { bank: "FNB",           type: "Business Cheque",  prefix: "62" },
  { bank: "Standard Bank", type: "Business Current", prefix: "27" },
  { bank: "Absa",          type: "Business Cheque",  prefix: "40" },
  { bank: "Nedbank",       type: "Business Current", prefix: "11" },
  { bank: "Capitec",       type: "Business Savings", prefix: "14" },
  { bank: "Investec",      type: "Business Call",    prefix: "50" },
];

const COUNTERPARTIES = [
  ["Eskom Holdings", "out", 18000, 65000],
  ["City of Johannesburg", "out", 4000, 22000],
  ["SARS VAT", "out", 30000, 140000],
  ["Payroll run", "out", 120000, 480000],
  ["Office Rentals SA", "out", 25000, 40000],
  ["Telkom Business", "out", 1500, 6000],
  ["Client receipt – Acme Mining", "in", 60000, 300000],
  ["Client receipt – Karoo Foods", "in", 20000, 140000],
  ["Client receipt – Umoya Logistics", "in", 15000, 90000],
  ["Card settlement", "in", 8000, 45000],
] as const;

// mulberry32 PRNG — small, deterministic
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFrom(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function bankFor(ctx: ConnectorContext) {
  const wanted = (ctx.label ?? "").toLowerCase();
  return BANKS.find((b) => b.bank.toLowerCase() === wanted) ?? BANKS[seedFrom(ctx.connectionId) % BANKS.length];
}

export const simulatedConnector: BankConnector = {
  id: "simulated",
  displayName: "Demo data (simulated)",

  async listAccounts(ctx) {
    const b = bankFor(ctx);
    const r = rng(seedFrom(ctx.connectionId));
    const n = 1 + Math.floor(r() * 2);
    return Array.from({ length: n }, (_, i): ExternalAccount => {
      const acct = b.prefix + String(Math.floor(100000000 + r() * 899999999));
      const bal = round2(150000 + r() * 2_400_000);
      return {
        externalId: `${ctx.connectionId}-${i}`,
        bank: b.bank,
        accountNumber: acct,
        accountType: i === 0 ? b.type : "Business Savings",
        currency: "ZAR",
        currentBalance: bal,
        availableBalance: bal,
      };
    });
  },

  async listTransactions(_ctx, account, since) {
    const r = rng(seedFrom(account.externalId));
    const out: ExternalTransaction[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let d = 0; d < 90; d++) {
      const day = new Date(today.getTime() - d * 864e5);
      if (day < since) break;
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      const count = Math.floor(r() * 3);
      for (let k = 0; k < count; k++) {
        const [name, dir, lo, hi] = COUNTERPARTIES[Math.floor(r() * COUNTERPARTIES.length)];
        const amt = round2(lo + r() * (hi - lo));
        out.push({
          externalId: `${account.externalId}-${d}-${k}`,
          date: new Date(day.getTime() + (8 + k * 3) * 36e5),
          amount: dir === "in" ? amt : -amt,
          description: name,
          reference: `SIM-${day.toISOString().slice(0, 10).replace(/-/g, "")}-${k}`,
        });
      }
    }
    return out;
  },
};
