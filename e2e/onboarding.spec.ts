import { test, expect } from "@playwright/test";

test.describe("onboarding flow", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("movie search and selection UI", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();

    const search = page.getByRole("combobox", { name: /search for a movie/i });
    await search.fill("Inception");
    await expect(page.getByText(/searching/i).or(page.getByRole("option"))).toBeVisible({ timeout: 15000 });

    const result = page.getByRole("option").first();
    await result.waitFor({ state: "visible", timeout: 20000 });
    await result.getByRole("button").click();

    await expect(page.getByText(/your favorites \(1\)/i)).toBeVisible();
  });
});
