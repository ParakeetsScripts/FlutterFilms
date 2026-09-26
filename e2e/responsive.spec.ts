import { test, expect } from "@playwright/test";

const ROUTES = [
  "/",
  "/movies",
  "/copilot",
  "/my-cinema",
  "/watchlist",
  "/rooms",
  "/intelligence",
  "/images",
  "/videos",
];

async function assertNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > window.innerWidth + 1;
  });
  expect(overflow).toBe(false);
}

for (const route of ROUTES) {
  test(`no horizontal overflow on ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    await assertNoHorizontalOverflow(page);
  });

  test(`primary content visible on ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();
    const heroOrTitle = page.locator(
      "h1, .hero-search__title, .page-header__title, .empty-state__title, main [role='status']",
    ).first();
    await expect(heroOrTitle).toBeVisible({ timeout: 15_000 });
  });
}

test("homepage hero CTA visible", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /what do you feel like watching/i })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("button", { name: /start discovering/i })).toBeVisible();
});

test("sign in navigates to login", async ({ page, viewport }) => {
  await page.goto("/");
  if (viewport && viewport.width < 900) {
    await page.getByRole("button", { name: /^more$/i }).click();
    await page.getByRole("dialog", { name: "More destinations" }).getByRole("link", { name: /^sign in$/i }).click();
  } else {
    await page.getByRole("link", { name: /^sign in$/i }).click();
  }
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});
