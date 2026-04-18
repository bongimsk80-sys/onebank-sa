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
export function isTokenExpired(expiry: Date | null | undefined): boolean {
  if (!expiry) return true; // treat missing expiry as expired — safe default
  return expiry.getTime() < Date.now();
}

// ── Expiry helpers ────────────────────────────────────────────────────────────

/** Verification email link expires in 24 hours. */
export function verificationTokenExpiry(): Date {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

/** Invite link expires in 7 days. */
export function inviteTokenExpiry(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

/** Password-reset link expires in 1 hour. */
export function resetTokenExpiry(): Date {
  return new Date(Date.now() + 60 * 60 * 1000);
}
