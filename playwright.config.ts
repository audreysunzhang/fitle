import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Pixel 7"],
    permissions: ["clipboard-read", "clipboard-write"],
  },
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    env: { NO_LOCAL_CONTENT: "1" },
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
