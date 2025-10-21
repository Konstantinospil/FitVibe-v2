const { test, expect } = require("@playwright/test");

test("home page renders FitVibe header", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText(/FitVibe/i);
});
