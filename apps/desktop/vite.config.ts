import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { resolve } from "node:path";

const desktopRoot = import.meta.dirname;
const rendererRoot = resolve(desktopRoot, "src/renderer");

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    alias: {
      "@": rendererRoot,
      "@orbit/api": resolve(desktopRoot, "../../packages/api/src"),
      "@orbit/ui": resolve(desktopRoot, "../../packages/ui/src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
