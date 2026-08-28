import { describe, expect, it } from "vitest";
import { decryptToken, encryptToken } from "./tokens";

describe("token encryption", () => {
  it("round-trips a value", () => {
    const secret = "ya29.a0AfumsomeoauthtokenXYZ";
    const enc = encryptToken(secret);
    expect(enc).not.toContain(secret);
    expect(decryptToken(enc)).toBe(secret);
  });

  it("produces a different ciphertext each time (random IV)", () => {
    expect(encryptToken("same")).not.toBe(encryptToken("same"));
  });

  it("fails to decrypt tampered payloads", () => {
    const enc = encryptToken("hello");
    const tampered = `${enc.slice(0, -4)}AAAA`;
    expect(() => decryptToken(tampered)).toThrow();
  });
});
