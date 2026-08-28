import { describe, expect, it } from "vitest";
import { normalizeHashtags, parseJsonObject } from "./prompts";

describe("parseJsonObject", () => {
  it("extracts JSON from a fenced code block", () => {
    const out = parseJsonObject<{ text: string }>(
      'Sure!\n```json\n{ "text": "hello" }\n```',
    );
    expect(out.text).toBe("hello");
  });

  it("extracts a bare JSON object surrounded by prose", () => {
    const out = parseJsonObject<{ caption: string }>(
      'Here you go: { "caption": "hi" } — hope that helps',
    );
    expect(out.caption).toBe("hi");
  });

  it("throws when there is no object", () => {
    expect(() => parseJsonObject("no json here")).toThrow();
  });
});

describe("normalizeHashtags", () => {
  it("strips leading hashes and blanks, caps at 30", () => {
    expect(normalizeHashtags(["#ai", "  tech ", "", "#ai"])).toEqual([
      "ai",
      "tech",
      "ai",
    ]);
    expect(normalizeHashtags("nope")).toEqual([]);
    expect(normalizeHashtags(Array(50).fill("x")).length).toBe(30);
  });
});
