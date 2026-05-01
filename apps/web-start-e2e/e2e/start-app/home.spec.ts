import { test, expect } from "@playwright/test";

test.describe("TanStack Start Home", () => {
  test("loads home page", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /tanstack start demo/i })).toBeVisible();
  });
});