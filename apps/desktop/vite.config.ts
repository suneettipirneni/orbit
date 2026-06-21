import { reactRouter } from "@react-router/dev/vite";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from "node:path";

const desktopRoot = import.meta.dirname;
const rendererRoot = resolve(desktopRoot, "src/renderer");
const e2eMocksRoot = resolve(desktopRoot, "e2e/fixtures/renderer-mocks");
const useE2eMocks = process.env.ORBIT_E2E_MOCKS === "1";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    alias: {
      ...(useE2eMocks
        ? {
            "@/lib/queries/deck": resolve(e2eMocksRoot, "queries/deck.ts"),
            "@/lib/queries/review": resolve(e2eMocksRoot, "queries/review.ts"),
            "@/lib/repo/card": resolve(e2eMocksRoot, "repo/card.ts"),
            "@/lib/repo/deck": resolve(e2eMocksRoot, "repo/deck.ts"),
            "@/lib/repo/note": resolve(e2eMocksRoot, "repo/note.ts"),
            "@/lib/repo/review": resolve(e2eMocksRoot, "repo/review.ts"),
          }
        : {}),
      "@": rendererRoot,
      "@orbit/types": resolve(desktopRoot, "../../packages/types/src"),
      "@orbit/ui": resolve(desktopRoot, "../../packages/ui/src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
