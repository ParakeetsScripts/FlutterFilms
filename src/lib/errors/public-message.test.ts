import { describe, expect, it } from "vitest";
import { isInfrastructureError, readApiError, sanitizePublicErrorMessage } from "./public-message";

describe("sanitizePublicErrorMessage", () => {
  it("hides provider quota errors", () => {
    const raw = "Your account or project has exceeded the quota. Upgrade your plan to increase limits.";
    expect(sanitizePublicErrorMessage(raw, "save")).toBe(
      "We couldn't sync right now. Your choices are saved on this device — try again later.",
    );
    expect(isInfrastructureError(raw)).toBe(true);
  });

  it("keeps short user-facing validation messages", () => {
    expect(sanitizePublicErrorMessage("Select at least 3 movies.", "save")).toBe("Select at least 3 movies.");
  });

  it("sanitizes API payload errors", () => {
    const raw = "Your account or project has exceeded the quota. Upgrade your plan to increase limits.";
    expect(readApiError({ error: raw }, "save")).toBe(
      "We couldn't sync right now. Your choices are saved on this device — try again later.",
    );
  });
});
