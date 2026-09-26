import { expect, test } from "@playwright/test";

function mobileNav(page: import("@playwright/test").Page) {
  return page.locator(".mobile-nav");
}

test.describe("mobile navigation", () => {
  test.beforeEach(({ viewport }) => {
    test.skip(Boolean(viewport && viewport.width >= 900), "Mobile navigation tests only");
  });

  test("bottom tabs navigate to primary destinations", async ({ page }) => {
    await page.goto("/");
    const nav = mobileNav(page);
    await expect(nav).toBeVisible();

    await nav.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about/);

    await nav.getByRole("link", { name: "AI" }).click();
    await expect(page).toHaveURL(/\/copilot/);

    await nav.getByRole("link", { name: "Discover" }).click();
    await expect(page).toHaveURL(/\/movies/);
  });

  test("more menu exposes platform links and search", async ({ page }) => {
    await page.goto("/");
    await expect(mobileNav(page)).toBeVisible();
    await page.getByRole("button", { name: /^more$/i }).click();
    const menu = page.getByRole("dialog", { name: "More destinations" });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("link", { name: "Intelligence" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Watchlist" })).toBeVisible();
    await expect(menu.getByRole("button", { name: "Search" })).toBeVisible();
    await menu.getByRole("link", { name: "Intelligence" }).click();
    await expect(page).toHaveURL(/\/intelligence/);
    await expect(page.getByRole("heading", { name: /200 AI Capabilities/i })).toBeVisible();
  });

  test("header search opens overlay on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(mobileNav(page)).toBeVisible();
    await page.locator(".search-trigger-mobile").click();
    await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();
  });

  test("install platform tabs switch instructions", async ({ page }) => {
    await page.goto("/install");
    const tabs = page.locator(".install-platform-tabs");
    await tabs.scrollIntoViewIfNeeded();
    const iphone = tabs.getByRole("tab", { name: "iPhone" });
    const android = tabs.getByRole("tab", { name: "Android" });
    await iphone.click();
    await expect(iphone).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText("Safari");
    await android.scrollIntoViewIfNeeded();
    await android.click();
    await expect(android).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText(/browser menu|Install app/i);
  });

  test("intelligence category tabs filter on mobile", async ({ page }) => {
    await page.goto("/intelligence");
    const franchiseTab = page.getByRole("tab", { name: "franchise" });
    await franchiseTab.click();
    await expect(franchiseTab).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".ai-feature-card").first()).toBeVisible();
  });
});
