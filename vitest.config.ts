import path from "node:path";
import { defineConfig } from "vitest/config";

// Pure vitest config without inheriting from vite.config.ts
export default defineConfig(
  {
    test: {
      environment: "node",
      include: ["server/**/*.test.ts"],
      globals: true,
      setupFiles: ["./vitest.setup.ts"],
      globalSetup: ["./tests/setup/db.teardown.ts"],
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    define: {
      __vite_ssr_exportName__: "(name, value) => value",
    },
  },
  {
    // Override so vitest doesn't merge with vite.config.ts
    ssr: false,
  }
);
