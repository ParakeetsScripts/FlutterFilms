import { test, expect } from "@playwright/test";

const EMPTY_ONBOARDING_STATE = {
  version: 2,
  step: 0,
  completed: false,
  completedAt: null,
  favoriteMovies: [],
  favoriteGenres: [],
  favoritePeople: [],
  preferredLanguages: [],
  discoveryPreferences: { familiarity: "familiar", energy: "balanced", scope: "balanced" },
};

test.describe("onboarding flow", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("movie search and selection UI", async ({ page }) => {
    await page.route("**/api/onboarding/state", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ state: EMPTY_ONBOARDING_STATE, authenticated: false }),
      });
    });
    await page.route("**/api/onboarding/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          query: "Inception",
          movies: [{ id: 27205, tmdbId: 27205, title: "Inception", year: 2010, posterPath: null }],
          people: [],
        }),
      });
    });

    await page.goto("/onboarding");
    await expect(page.getByRole("heading", { name: /welcome to flutterfilms/i })).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /continue/i }).click();

    const search = page.getByRole("combobox", { name: /search for a movie/i });
    await search.fill("Inception");
    await expect(page.getByText(/searching/i).or(page.getByRole("option"))).toBeVisible({ timeout: 15_000 });

    const result = page.getByRole("option").first();
    await result.waitFor({ state: "visible", timeout: 20_000 });
    await result.getByRole("button").click();

    await expect(page.getByText(/your favorites \(1\)/i)).toBeVisible();
  });
});
