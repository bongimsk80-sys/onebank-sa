/**
 * Bank data connector contract.
 *
 * Every source of bank data — the demo generator, Stitch, Yodlee, and later
 * direct bank APIs — implements this interface. The sync engine
 * (lib/connectors/sync.ts) is the only caller, so adding a provider never
 * touches pages or API routes.
 *
 * Money crosses this boundary as rand amounts (numbers, 2 dp) because the
 * existing schema stores Float; normalise to cents when the schema migrates.
 */

export type ProviderId = "simulated" | "stitch" | "yodlee";

export interface ProviderTokens {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scopes?: string | null;
  externalUserId?: string | null;
}

export interface ConnectorContext {
  connectionId: string;
  organisationId: string;
  tokens: ProviderTokens | null;
  /** seed for deterministic demo data */
  label?: string | null;
}

export interface ExternalAccount {
  externalId: string;
  bank: string;
  accountNumber: string; // as returned (may be masked by the provider)
  accountType: string;
  name?: string;
  currency: string;
  currentBalance: number;
  availableBalance?: number | null;
}

export interface ExternalTransaction {
  externalId?: string | null;
  date: Date;
  amount: number; // positive = money in, negative = money out
  description: string;
  reference: string;
  runningBalance?: number | null;
}

export interface BankConnector {
  id: ProviderId;
  /** Human label for UI */
  displayName: string;
  /** Called before each sync; returns refreshed tokens when they changed. */
  refresh?(ctx: ConnectorContext): Promise<ProviderTokens | null>;
  listAccounts(ctx: ConnectorContext): Promise<ExternalAccount[]>;
  listTransactions(ctx: ConnectorContext, account: ExternalAccount, since: Date): Promise<ExternalTransaction[]>;
}

export class ConnectorNotConfiguredError extends Error {
  constructor(provider: ProviderId, missing: string[]) {
    super(`${provider} is not configured. Missing environment variables: ${missing.join(", ")}`);
    this.name = "ConnectorNotConfiguredError";
  }
}

export function requireEnv(provider: ProviderId, names: string[]): Record<string, string> {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) throw new ConnectorNotConfiguredError(provider, missing);
  return Object.fromEntries(names.map((n) => [n, process.env[n] as string]));
}
