import { describe, expect, it } from "vitest";
import { SandboxProvider } from "./sandbox";
import { AppError } from "@/lib/errors";

const account = {
  externalAccountId: "sbx_1",
  accountName: "@demo",
  accessToken: "t",
  metadata: {},
};

describe("SandboxProvider", () => {
  it("is always marked as sandbox", () => {
    expect(new SandboxProvider("linkedin").isSandbox).toBe(true);
  });

  it("publishes with a sandbox-prefixed id and isSandbox flag", async () => {
    const res = await new SandboxProvider("x").publish({
      content: "hello world",
      media: [],
      account,
      idempotencyKey: "k1",
    });
    expect(res.isSandbox).toBe(true);
    expect(res.externalPostId).toMatch(/^sandbox_x_/);
  });

  it("throws a provider error for the #failtest hook", async () => {
    await expect(
      new SandboxProvider("facebook").publish({
        content: "oops #failtest",
        media: [],
        account,
        idempotencyKey: "k2",
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("round-trips an OAuth connect", async () => {
    const provider = new SandboxProvider("instagram");
    const url = provider.getAuthUrl({
      state: "s",
      redirectUri: "https://app.local/api/social/instagram/callback",
    });
    expect(url).toContain("state=s");
    const connected = await provider.handleCallback({
      code: "c",
      state: "s",
      redirectUri: "https://app.local/api/social/instagram/callback",
    });
    expect(connected.accessToken).toBeTruthy();
    expect(connected.externalAccountId).toMatch(/^sbx_instagram_/);
  });
});
