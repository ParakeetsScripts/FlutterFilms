import { expect, test } from "@playwright/test";

test.describe("About and Install pages", () => {
  test("about page uses FlutterFilms branding", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("h1")).toContainText("About FlutterFilms");
    await expect(page.getByText("FlutterFilms by Ritvik M")).toHaveCount(0);
    await expect(page.getByText("by Ritvik M")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Explore movies" })).toBeVisible();
  });

  test("install page uses canonical branding and title", async ({ page }) => {
    await page.goto("/install");
    await expect(page.locator("h1")).toHaveText("Install FlutterFilms");
    await expect(page.getByText("flutterfilms.app")).toHaveCount(0);
    await expect(page.getByText("Add FlutterFilms by Ritvik M")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /iPhone|Android|Mac/ }).first()).toBeVisible();
  });

  test("header nav includes About next to Home", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator(".site-header__nav");
    await expect(nav.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Discover" })).toBeVisible();
  });
});
