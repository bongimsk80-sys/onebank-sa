import { randomBytes } from "crypto";

/** Returns a cryptographically secure random 64-character hex string. */
function generateSecureToken(): string {
  return randomBytes(32).toString("hex"); // 32 bytes → 64 hex chars
}

export function generateVerificationToken(): string {
  return generateSecureToken();
}

export function generateResetToken(): string {
  return generateSecureToken();
}

export function generateInviteToken(): string {
  return generateSecureToken();
}

/** Returns true if the given expiry date is in the past. */
export function isTokenExpired(expiry: Date): boolean {
  return expiry.getTime() < Date.now();
}
