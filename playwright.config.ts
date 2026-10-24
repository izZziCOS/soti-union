import { defineConfig, devices } from "@playwright/test";

const externalBaseURL = process.env.BASE_URL;
const port = 4321;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: externalBaseURL ?? `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // Without BASE_URL, test the production build through `astro preview` (run `npm run build` first).
  ...(!externalBaseURL && {
    webServer: {
      command: `npm run preview -- --host 127.0.0.1 --port ${port}`,
      url: `http://127.0.0.1:${port}`,
      reuseExistingServer: !process.env.CI,
    },
  }),
});
