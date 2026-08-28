import { describe, expect, it } from "vitest";
import { backoffSeconds } from "./backoff";
import { PUBLISHING } from "@/lib/constants";

describe("publishing backoff", () => {
  it("grows exponentially from the base delay", () => {
    expect(backoffSeconds(1)).toBe(PUBLISHING.backoffBaseSeconds);
    expect(backoffSeconds(2)).toBe(PUBLISHING.backoffBaseSeconds * 2);
    expect(backoffSeconds(3)).toBe(PUBLISHING.backoffBaseSeconds * 4);
  });

  it("never exceeds the configured ceiling", () => {
    expect(backoffSeconds(50)).toBe(PUBLISHING.backoffMaxSeconds);
  });
});
