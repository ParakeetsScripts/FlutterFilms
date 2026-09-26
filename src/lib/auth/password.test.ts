import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, validatePassword } from "./password";

describe("password", () => {
  it("hashes and verifies", async () => {
    const hash = await hashPassword("testpassword123");
    expect(await verifyPassword("testpassword123", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("rejects short passwords", () => {
    expect(() => validatePassword("short")).toThrow();
  });
});
