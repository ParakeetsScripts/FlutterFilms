import { expect, test } from "@playwright/test";

test.describe("About and Install pages", () => {
  test("about page uses FlutterFilms branding", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#about-page-title")).toHaveCount(1, { timeout: 10_000 });
    await expect(page.locator("#about-page-title")).toContainText("About FlutterFilms");
    await expect(page.locator(".brand-logo__credit")).toContainText("by Ritvik M");
    await expect(page.getByRole("link", { name: "Explore movies" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "200 capabilities" })).toBeVisible();
  });

  test("install page uses canonical branding and title", async ({ page }) => {
    await page.goto("/install");
    await expect(page.locator("h1")).toHaveText("Install FlutterFilms");
    await expect(page.getByText("flutterfilms.app")).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /iPhone|Android|Mac/ }).first()).toBeVisible();
  });

  test("header shows install button", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".site-header").getByRole("button", { name: "Install" })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("header nav includes About next to Home", async ({ page }) => {
    await page.goto("/");
    const desktopNav = page.locator(".site-nav");
    const mobileNav = page.locator(".mobile-nav");

    if (await desktopNav.isVisible()) {
      await expect(desktopNav.getByRole("link", { name: "Home" })).toBeVisible();
      await expect(desktopNav.getByRole("link", { name: "About" })).toBeVisible();
      await expect(desktopNav.getByRole("link", { name: "Discover" })).toBeVisible();
    } else {
      await expect(mobileNav).toBeVisible();
      await expect(mobileNav.getByRole("link", { name: "Home" })).toBeVisible();
      await expect(mobileNav.getByRole("link", { name: "About" })).toBeVisible();
      await expect(mobileNav.getByRole("link", { name: "Discover" })).toBeVisible();
      await page.getByRole("button", { name: /^more$/i }).click();
      await expect(
        page.getByRole("dialog", { name: "More destinations" }).getByRole("link", { name: "Intelligence" }),
      ).toBeVisible();
      await expect(
        page.getByRole("dialog", { name: "More destinations" }).getByRole("link", { name: "Watchlist" }),
      ).toBeVisible();
    }
  });
});
