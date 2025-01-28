import { defineConfig } from "vite";

export default defineConfig({
  test: {
    passWithNoTests: true,
    testTimeout: 60_000,
    setupFiles: ["dotenv/config"],
  },
});
