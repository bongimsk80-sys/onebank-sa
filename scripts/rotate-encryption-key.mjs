/**
 * ENCRYPTION KEY ROTATION SCRIPT
 * ================================
 * Run this BEFORE updating ENCRYPTION_KEY in Vercel.
 *
 * What it does:
 *  1. Reads all ErpConnection rows that have an encrypted apiKey
 *  2. Decrypts each one with the OLD key
 *  3. Re-encrypts with the NEW key
 *  4. Writes back to the database
 *  5. Prints a summary — no rows are touched unless decryption succeeds
 *
 * Usage:
 *   OLD_ENCRYPTION_KEY=<old-key> NEW_ENCRYPTION_KEY=<new-key> node scripts/rotate-encryption-key.mjs
 *
 * Both keys must be set. The script will refuse to run if either is missing.
 */

import { PrismaClient } from "@prisma/client";
import CryptoJS from "crypto-js";

const OLD_KEY = process.env.OLD_ENCRYPTION_KEY;
const NEW_KEY = process.env.NEW_ENCRYPTION_KEY;

if (!OLD_KEY || !NEW_KEY) {
  console.error("❌  Both OLD_ENCRYPTION_KEY and NEW_ENCRYPTION_KEY must be set.");
  console.error("    Usage: OLD_ENCRYPTION_KEY=xxx NEW_ENCRYPTION_KEY=yyy node scripts/rotate-encryption-key.mjs");
  process.exit(1);
}

if (OLD_KEY === NEW_KEY) {
  console.error("❌  OLD_ENCRYPTION_KEY and NEW_ENCRYPTION_KEY are identical — nothing to do.");
  process.exit(1);
}

const prisma = new PrismaClient();

function decrypt(ciphertext, key) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

function encrypt(plaintext, key) {
  return CryptoJS.AES.encrypt(plaintext, key).toString();
}

async function main() {
  console.log("🔐  Starting encryption key rotation...\n");

  const connections = await prisma.erpConnection.findMany({
    where: { apiKey: { not: null } },
    select: { id: true, name: true, provider: true, apiKey: true },
  });

  console.log(`   Found ${connections.length} ErpConnection row(s) with an apiKey.\n`);

  if (connections.length === 0) {
    console.log("✅  Nothing to re-encrypt. Safe to update ENCRYPTION_KEY in Vercel now.");
    return;
  }

  let succeeded = 0;
  let failed = 0;

  for (const conn of connections) {
    try {
      // Decrypt with old key
      const plaintext = decrypt(conn.apiKey, OLD_KEY);

      if (!plaintext) {
        throw new Error("Decryption returned empty string — wrong OLD_ENCRYPTION_KEY?");
      }

      // Re-encrypt with new key
      const newCiphertext = encrypt(plaintext, NEW_KEY);

      // Write back
      await prisma.erpConnection.update({
        where: { id: conn.id },
        data: { apiKey: newCiphertext },
      });

      console.log(`   ✓  ${conn.name} (${conn.provider}) — re-encrypted`);
      succeeded++;
    } catch (err) {
      console.error(`   ✗  ${conn.name} (${conn.provider}) — FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n   Done: ${succeeded} succeeded, ${failed} failed.\n`);

  if (failed > 0) {
    console.error("❌  Some rows failed. Do NOT update ENCRYPTION_KEY in Vercel until all rows succeed.");
    process.exit(1);
  }

  console.log("✅  All rows re-encrypted successfully.");
  console.log("    You can now update ENCRYPTION_KEY in Vercel to the new value and redeploy.");
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
