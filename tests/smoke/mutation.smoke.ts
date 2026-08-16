import { expect, test } from "@playwright/test";
import { localAccounts, signIn } from "./helpers/auth";
import { resetSmokeFixture } from "./helpers/fixtureState";

test("Join Class is repeatable and refreshes memberships immediately", async ({ page }) => {
  await resetSmokeFixture("join");
  await signIn(page, "smokeJoin");
  await page.goto("/classes");

  await page.getByLabel("Class join code").fill("NOT-A-VALID-CODE");
  await page.getByRole("button", { name: "Join Class" }).click();
  await expect(page.getByRole("alert")).toHaveText("That join code is invalid or unavailable.");
  await expect(page.getByRole("heading", { name: "Smoke Joinable Class" })).toHaveCount(0);

  await page.getByLabel("Class join code").fill("A52C000000000102");
  await page.getByRole("button", { name: "Join Class" }).click();
  await expect(page.getByRole("status")).toHaveText("Class joined. Assigned Courses are ready below.");
  await expect(page.getByRole("heading", { name: "Smoke Joinable Class" })).toBeVisible();
  await expect(page.getByText(localAccounts.smokeJoin.email, { exact: true })).toBeVisible();
});

test("Assignment completion opens the next immutable Lesson without stale summary state", async ({ page }) => {
  await resetSmokeFixture("completion");
  await signIn(page, "smokeCompletion");
  await page.goto("/classes");

  const smokeClass = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Smoke Completion Class" }) });
  await expect(smokeClass.getByText(/Class Progress .* 0 of 2 Lessons/)).toBeVisible();
  await smokeClass.getByRole("link", { name: "Continue Assignment" }).click();
  await expect(page.getByRole("link", { name: /Smoke Lesson 1 Available/ })).toBeVisible();
  await expect(page.locator('[aria-disabled="true"]').filter({ hasText: "Smoke Lesson 2" })).toContainText("Locked");

  await page.getByRole("link", { name: /Smoke Lesson 1 Available/ }).click();
  await expect(page.getByRole("heading", { name: "Smoke Learn 1" })).toBeVisible();
  await page.getByRole("button", { name: "Complete Lesson" }).click();
  await expect(page.getByText("Lesson completed", { exact: true })).toBeVisible();
  await expect(page.getByText("Activities").locator("..")).toContainText("1 of 1");
  const nextLesson = page.getByRole("link", { name: /Next Lesson/ });
  await expect(nextLesson).toBeVisible();
  await nextLesson.click();

  await expect(page).toHaveURL(/\/releases\/\d+\/lessons\/\d+\?classId=953101/);
  await expect(page.getByRole("heading", { name: "Smoke Learn 2" })).toBeVisible();
  await expect(page.getByText("Lesson completed", { exact: true })).toHaveCount(0);
  await expect(page.getByText("100%", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Complete Lesson" })).toBeVisible();
});
