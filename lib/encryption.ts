import CryptoJS from "crypto-js";

function getSecret(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      // In production a missing key is a hard blocker — fail loud so it
      // shows up immediately in Vercel build/runtime logs.
      throw new Error(
        "[encryption] ENCRYPTION_KEY environment variable is not set. " +
          "Add it to your Vercel project settings before deploying."
      );
    }
    // In development/test, warn once and fall back to a local-only placeholder.
    console.warn(
      "[encryption] ENCRYPTION_KEY not set — using insecure dev placeholder. " +
        "Set ENCRYPTION_KEY in .env.local before testing encryption."
    );
    return "dev-placeholder-key-do-not-use-in-prod";
  }
  return key;
}

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, getSecret()).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, getSecret());
  return bytes.toString(CryptoJS.enc.Utf8);
}

/** Returns true when the encryption key is properly configured. */
export function isEncryptionConfigured(): boolean {
  return Boolean(process.env.ENCRYPTION_KEY);
}
