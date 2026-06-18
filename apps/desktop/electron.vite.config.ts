import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import { resolve } from "node:path";

const desktopRoot = import.meta.dirname;
const webRoot = resolve(desktopRoot, "../web");

export default defineConfig({
  main: {
    build: {
      externalizeDeps: {
        exclude: ["@orbit/anki", "@orbit/api", "@orbit/server"],
      },
      rollupOptions: {
        external: ["electron", "better-sqlite3"],
        input: {
          index: resolve(desktopRoot, "src/main.ts"),
        },
      },
    },
  },
  renderer: {
    base: "./",
    build: {
      outDir: resolve(desktopRoot, "out/renderer"),
      rollupOptions: {
        input: {
          index: resolve(webRoot, "index.html"),
        },
      },
    },
    plugins: [
      react({
        babel: {
          plugins: ["babel-plugin-react-compiler"],
        },
      }),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": resolve(webRoot, "src"),
        "@orbit/api": resolve(desktopRoot, "../../packages/api/src"),
        "@orbit/ui": resolve(desktopRoot, "../../packages/ui/src"),
      },
    },
    root: webRoot,
    server: {
      port: 5173,
      strictPort: true,
    },
  },
});
