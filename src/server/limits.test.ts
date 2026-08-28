import { describe, expect, it } from "vitest";
import { planLimits } from "./limits";
import { PLANS } from "@/lib/constants";

describe("planLimits", () => {
  it("returns the base limits for a plan", () => {
    expect(planLimits({ plan: "FREE", limits: {} }).socialAccounts).toBe(2);
    expect(planLimits({ plan: "PRO", limits: {} }).postsPerMonth).toBe(-1);
  });

  it("applies per-workspace overrides on top of the plan", () => {
    const limits = planLimits({ plan: "FREE", limits: { socialAccounts: 99 } });
    expect(limits.socialAccounts).toBe(99);
    expect(limits.postsPerMonth).toBe(PLANS.FREE.limits.postsPerMonth);
  });
});
