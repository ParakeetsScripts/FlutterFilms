import { describe, expect, it } from "vitest";
import { validateSelfHostedUrl } from "./security";

describe("validateSelfHostedUrl", () => {
  it("allows localhost when explicitly permitted", () => {
    expect(validateSelfHostedUrl("http://localhost:11434", { allowLocalhost: true })).toBe("http://localhost:11434");
  });

  it("blocks private IPs by default", () => {
    expect(() => validateSelfHostedUrl("http://192.168.1.50/v1")).toThrow(/Private network/);
  });

  it("strips trailing slash", () => {
    expect(validateSelfHostedUrl("https://ai.example.com/v1/", { allowLocalhost: false })).toBe("https://ai.example.com/v1");
  });
});
