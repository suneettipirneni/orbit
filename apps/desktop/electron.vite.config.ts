import { defineConfig } from "electron-vite";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const desktopRoot = import.meta.dirname;
const require = createRequire(import.meta.url);
const betterSqliteRoot = dirname(require.resolve("better-sqlite3/package.json"));
const betterSqliteNativeBinding = resolve(betterSqliteRoot, "build/Release/better_sqlite3.node");

export default defineConfig({
  main: {
    build: {
      externalizeDeps: {
        exclude: ["@orbit/anki", "@orbit/types"],
      },
      rollupOptions: {
        external: ["electron", "better-sqlite3"],
        input: {
          index: resolve(desktopRoot, "src/main/index.ts"),
        },
      },
    },
    plugins: [
      {
        closeBundle() {
          const packagedNativeBinding = resolve(desktopRoot, "out/native/better_sqlite3.node");

          if (!existsSync(betterSqliteNativeBinding)) {
            throw new Error(
              `Missing better-sqlite3 native binding at ${betterSqliteNativeBinding}`,
            );
          }

          mkdirSync(dirname(packagedNativeBinding), { recursive: true });
          copyFileSync(betterSqliteNativeBinding, packagedNativeBinding);
        },
        name: "copy-native-assets",
      },
    ],
  },
  preload: {
    build: {
      rollupOptions: {
        external: ["electron"],
        input: {
          index: resolve(desktopRoot, "src/preload/index.ts"),
        },
        output: {
          entryFileNames: "[name].js",
          format: "cjs",
        },
      },
    },
  },
});
