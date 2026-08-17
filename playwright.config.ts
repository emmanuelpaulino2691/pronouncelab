import { defineConfig } from "@playwright/test";
import { loadEnv } from "vite";

const env = loadEnv("development", process.cwd(), "");
const supabaseUrl = env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error("Browser smoke tests require VITE_SUPABASE_URL in the local Vite environment.");
}

const backend = new URL(supabaseUrl);
if (!["localhost", "127.0.0.1"].includes(backend.hostname)) {
  throw new Error(`Browser smoke tests refuse to use a non-local Supabase backend (${backend.origin}).`);
}

export default defineConfig({
  testDir: "./tests/smoke",
  testMatch: "**/*.smoke.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://127.0.0.1:5173",
    browserName: "chromium",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
});
