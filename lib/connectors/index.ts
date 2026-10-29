import type { BankConnector, ProviderId } from "./types";
import { simulatedConnector } from "./simulated";
import { stitchConnector, stitchConfigured } from "./stitch";
import { yodleeConnector, yodleeConfigured } from "./yodlee";

export const connectors: Record<ProviderId, BankConnector> = {
  simulated: simulatedConnector,
  stitch: stitchConnector,
  yodlee: yodleeConnector,
};

export function getConnector(id: string): BankConnector {
  const c = connectors[id as ProviderId];
  if (!c) throw new Error(`Unknown bank data provider: ${id}`);
  return c;
}

/** What the "Connect a bank" screen may offer in this deployment. */
export function availableProviders() {
  return [
    {
      id: "stitch" as const,
      name: "Stitch",
      description: "Link South African bank accounts with the account holder's consent. Up to 3 months of history.",
      enabled: stitchConfigured(),
      reason: stitchConfigured() ? null : "Awaiting Stitch client credentials (STITCH_CLIENT_ID, STITCH_CLIENT_SECRET, STITCH_REDIRECT_URI).",
    },
    {
      id: "yodlee" as const,
      name: "Yodlee",
      description: "Global aggregator. South African coverage not confirmed.",
      enabled: yodleeConfigured(),
      reason: yodleeConfigured() ? null : "Disabled until Yodlee confirms South African business-banking coverage.",
    },
    {
      id: "simulated" as const,
      name: "Demo data",
      description: "Realistic simulated South African bank data for demos and testing. No real bank is contacted.",
      enabled: process.env.ENABLE_SIMULATED_BANKS !== "false",
      reason: null,
    },
  ];
}
