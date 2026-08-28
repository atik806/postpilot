import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

/**
 * AES-256-GCM encryption for social OAuth tokens at rest (spec §21).
 * Stored format: base64( iv[12] || authTag[16] || ciphertext ).
 * The key comes from TOKEN_ENCRYPTION_KEY — 64 hex chars (32 bytes).
 */

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function key(): Buffer {
  const raw = env.tokenEncryptionKey();
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with `openssl rand -hex 32`.",
    );
  }
  return buf;
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptToken(payload: string): string {
  const raw = Buffer.from(payload, "base64");
  const iv = raw.subarray(0, IV_LEN);
  const tag = raw.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const enc = raw.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv(ALGO, key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString(
    "utf8",
  );
}

export function encryptTokenOrNull(v: string | null | undefined): string | null {
  return v ? encryptToken(v) : null;
}

export function decryptTokenOrNull(v: string | null | undefined): string | null {
  return v ? decryptToken(v) : null;
}
