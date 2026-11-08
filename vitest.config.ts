import path from "node:path";
import { defineConfig } from "vitest/config";

// A zone with DST, so the date tests exercise real 23- and 25-hour days.
process.env.TZ = "America/New_York";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node" },
});
