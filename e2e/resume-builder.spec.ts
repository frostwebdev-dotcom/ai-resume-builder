import { expect, test } from "@playwright/test";

test.describe("Resume builder smoke", () => {
  test("API health responds", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { ok?: boolean };
    expect(body.ok).toBe(true);
  });

  test("Guest /create loads editor chrome", async ({ page }) => {
    await page.goto("/create", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Resume title")).toBeVisible({ timeout: 120_000 });
    await expect(page.getByLabel("Undo")).toBeVisible();
    await expect(page.getByLabel("Redo")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Resume sections" })).toBeVisible();
  });

  test("Guest /create accepts template query and still loads", async ({ page }) => {
    await page.goto("/create?template=helios", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Resume title")).toBeVisible({ timeout: 120_000 });
  });

  test("Guest /create shows AI assist without sign-in", async ({ page }) => {
    await page.goto("/create", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Resume title")).toBeVisible({ timeout: 120_000 });
    await page.getByText("Profile", { exact: true }).first().click();
    await expect(page.getByRole("button", { name: "Generate summary" })).toBeVisible();
    await expect(page.getByText("Sign in for AI assist")).toHaveCount(0);
  });

  test("Marketing /templates shows catalog search", async ({ page }) => {
    await page.goto("/templates", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /pick a layout you trust/i })).toBeVisible();
    await expect(page.getByPlaceholder("Search templates by name or role")).toBeVisible({
      timeout: 60_000,
    });
  });

  test("Resume title edit and undo", async ({ page }) => {
    await page.goto("/create", { waitUntil: "domcontentloaded" });
    const title = page.getByLabel("Resume title");
    await title.waitFor({ state: "visible", timeout: 120_000 });
    await title.fill("E2E Test Resume");
    await title.blur();
    await expect(title).toHaveValue("E2E Test Resume");
    await page.getByLabel("Undo").click();
    await expect(title).not.toHaveValue("E2E Test Resume");
  });
});
