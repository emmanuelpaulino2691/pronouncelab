import { expect, test, type Page } from "@playwright/test";
import { localAccounts, signIn } from "./helpers/auth";

async function expectMain(page: Page) {
  await expect(page.getByRole("main")).toBeVisible();
}

test("learner login exposes the final learner navigation and assignment-only Home", async ({ page }) => {
  await signIn(page, "learner");
  await expectMain(page);
  await expect(page.getByText("Progress synced", { exact: true })).toBeVisible();
  await expect(page.getByText(localAccounts.learner.email, { exact: true })).toBeVisible();

  const navigation = page.getByRole("navigation", { name: "Student navigation" });
  for (const name of ["Home", "My Classes", "Course Library", "Progress"]) {
    await expect(navigation.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await expect(navigation.getByRole("link", { name: /Content Studio/i })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Active Assignments" })).toBeVisible();
  await expect(page.getByText(/Local Enrolled Class .* Teacher-assigned/)).toBeVisible();
  await expect(page.getByText("Independent Practice", { exact: true })).toHaveCount(0);
});

test("learner assignment, library, and progress contexts remain separate", async ({ page }) => {
  await signIn(page, "learner");

  await page.goto("/classes");
  await expect(page.getByRole("heading", { name: "My Classes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Local Enrolled Class" })).toBeVisible();
  await expect(page.getByText("Assigned Course", { exact: true })).toBeVisible();
  await expect(page.getByText(/Class Progress/).first()).toBeVisible();
  await page.getByRole("link", { name: "Continue Assignment" }).click();
  await expect(page).toHaveURL(/\/releases\/\d+\?classId=953001/);
  await expect(page.getByText("Class Assignment", { exact: true })).toBeVisible();
  await expect(page.getByText(/^Class Progress/).first()).toBeVisible();
  await expect(page.getByText("Locked", { exact: true }).first()).toBeVisible();

  await page.goto("/courses");
  await expect(page.getByRole("heading", { name: "Course Library" })).toBeVisible();
  await expect(page.getByText("Independent Practice", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Local Public Course" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Local Learner Course" })).toHaveCount(0);

  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Class Progress" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Independent Practice" })).toBeVisible();
  await expect(page.getByText(/Overall Progress/i)).toHaveCount(0);
});

test("teacher Published Student Preview survives nested navigation and refresh without changing either identity", async ({ browser }) => {
  const teacherContext = await browser.newContext();
  const learnerContext = await browser.newContext();
  const teacher = await teacherContext.newPage();
  const learner = await learnerContext.newPage();

  try {
    await signIn(teacher, "teacher");
    await signIn(learner, "learner");

    await teacher.goto("/admin/courses");
    await expect(teacher.getByRole("heading", { name: "Courses" })).toBeVisible();
    await expect(teacher.getByRole("heading", { name: "Local Learner Course" })).toBeVisible();
    await teacher.goto("/admin/classes");
    await expect(teacher.getByRole("heading", { name: "My Classes" })).toBeVisible();
    await expect(teacher.getByRole("heading", { name: "Local Enrolled Class" })).toBeVisible();
    await teacher.goto("/admin/courses/952001");
    await teacher.getByRole("link", { name: "Preview Published" }).click();
    await expect(teacher.getByText("Student Preview", { exact: true })).toBeVisible();
    await expect(teacher.getByText("Published Preview", { exact: true }).first()).toBeVisible();
    await expect(teacher.getByRole("navigation", { name: "Student navigation" })).toHaveCount(0);

    await teacher.getByRole("link", { name: /Open Progression Unit 1/ }).click();
    await teacher.getByRole("link", { name: /Unit 1 .* Lesson 1/ }).click();
    await expect(teacher.getByRole("heading", { name: "Learn: Welcome" })).toBeVisible();
    await teacher.reload();
    await expect(teacher.getByText("Student Preview", { exact: true })).toBeVisible();
    await expect(teacher.getByText("Published Preview", { exact: true }).first()).toBeVisible();

    await learner.reload();
    await expect(learner.getByText("Progress synced", { exact: true })).toBeVisible();
    await expect(learner.getByText(localAccounts.learner.email, { exact: true })).toBeVisible();

    await teacher.getByRole("link", { name: "Exit Preview" }).click();
    await expect(teacher).toHaveURL(/\/admin\/courses\/952001/);
    await expect(teacher.getByRole("complementary", { name: "Content Studio navigation" })).toBeVisible();
    await expect(teacher.getByText(localAccounts.teacher.email, { exact: true })).toBeVisible();
  } finally {
    await teacherContext.close();
    await learnerContext.close();
  }
});

test("learner navigation remains keyboard-usable at a phone viewport without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "learner");
  const menu = page.getByRole("button", { name: "Open student navigation" });
  await menu.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Student navigation" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close student navigation" })).toBeFocused();
  await dialog.getByRole("link", { name: "My Classes" }).click();
  await expect(page.getByRole("heading", { name: "My Classes" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Continue Assignment" })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
