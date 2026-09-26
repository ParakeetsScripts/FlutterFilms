import { expect, test } from "@playwright/test";

const DEEP_LINKS = [
  "/",
  "/search",
  "/onboarding",
  "/tonight",
  "/my-cinema",
  "/copilot",
  "/intelligence",
  "/intelligence/movie-dna",
  "/watchlists",
  "/rooms",
  "/about",
  "/install",
];

test.describe("PWA contract", () => {
  test("manifest is valid and branded", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");
    expect(response.ok()).toBeTruthy();
    const manifest = await response.json();
    expect(manifest.name).toBe("FlutterFilms");
    expect(manifest.short_name).toBe("FlutterFilms");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons?.length).toBeGreaterThan(2);
  });

  test("icons and service worker are reachable", async ({ request }) => {
    for (const path of ["/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png", "/sw.js", "/favicon.png"]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
    }
  });

  test("install page explains manual iOS path", async ({ page }) => {
    await page.goto("/install");
    await expect(page.getByRole("heading", { name: /install flutterfilms/i })).toBeVisible();
    await page.getByRole("tab", { name: "iPhone" }).click();
    await expect(page.getByRole("tabpanel")).toContainText(/Add to Home Screen/i);
    await expect(page.getByText(/does not provide offline movie streaming/i)).toBeVisible();
    await expect(page.getByText(/download the .* apk/i)).toHaveCount(0);
    await expect(page.getByText(/from the app store/i)).toHaveCount(0);
  });

  test("service worker registers on load", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html[data-sw-ready='true']")).toHaveAttribute("data-sw-ready", "true", {
      timeout: 15_000,
    });
    const registered = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration("/");
      return Boolean(reg);
    });
    expect(registered).toBe(true);
  });

  for (const route of DEEP_LINKS) {
    test(`deep link loads: ${route}`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBeLessThan(500);
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("body")).not.toBeEmpty();
    });
  }
});
