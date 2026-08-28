import { describe, expect, it } from "vitest";
import { getSocialProvider, isSandboxPlatform } from "./registry";
import { PLATFORMS } from "@/types";

describe("social provider registry", () => {
  it("falls back to the sandbox provider when no OAuth credentials are set", () => {
    for (const platform of PLATFORMS) {
      expect(isSandboxPlatform(platform)).toBe(true);
      expect(getSocialProvider(platform).isSandbox).toBe(true);
    }
  });

  it("exposes declared capabilities per platform", () => {
    expect(getSocialProvider("instagram").capabilities.publishText).toBe(false);
    expect(getSocialProvider("linkedin").capabilities.publishText).toBe(true);
  });
});
