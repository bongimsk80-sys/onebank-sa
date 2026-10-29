import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * AES-256-GCM field encryption for secrets that must be read back
 * (aggregator OAuth tokens, TOTP secrets).
 *
 * Format: "v1:<iv b64url>:<tag b64url>:<ciphertext b64url>"
 *
 * The key is derived from ENCRYPTION_KEY with SHA-256 so any sufficiently long
 * random string works. Generate one with: `openssl rand -base64 48`.
 * In production, prefer a managed KMS and envelope encryption; this module is
 * the single place to swap that in.
 */
function key(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[secure-crypto] ENCRYPTION_KEY is not set.");
    }
    return createHash("sha256").update("oneview-dev-only-key").digest();
  }
  return createHash("sha256").update(raw).digest();
}

export function seal(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ct.toString("base64url")].join(":");
}

export function open(sealed: string): string {
  const [v, iv, tag, ct] = sealed.split(":");
  if (v !== "v1" || !iv || !tag || !ct) throw new Error("[secure-crypto] Unrecognised ciphertext format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64url")), decipher.final()]).toString("utf8");
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
