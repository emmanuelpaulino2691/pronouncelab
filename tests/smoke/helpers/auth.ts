import { expect, type Page } from "@playwright/test";

export const localAccounts = {
  learner: {
    email: "learner.pronouncelab@gmail.com",
    password: "PronounceLabLocalLearner!2026",
  },
  teacher: {
    email: "emmanuelpaulino2691@gmail.com",
    password: "PronounceLabLocalTeacher!2026",
  },
} as const;

export async function signIn(page: Page, account: keyof typeof localAccounts) {
  const credentials = localAccounts[account];
  await page.goto("/login");
  await page.getByLabel("Email address").fill(credentials.email);
  await page.locator('input[name="password"]').fill(credentials.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);
}
