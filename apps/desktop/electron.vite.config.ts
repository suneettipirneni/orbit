import { defineConfig } from "electron-vite";
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const desktopRoot = import.meta.dirname;
const require = createRequire(import.meta.url);
const dbMigrationsRoot = resolve(desktopRoot, "src/main/db/migrations");
const betterSqliteRoot = dirname(require.resolve("better-sqlite3/package.json"));
const betterSqliteNativeBinding = resolve(betterSqliteRoot, "build/Release/better_sqlite3.node");

export default defineConfig({
  main: {
    build: {
      externalizeDeps: {
        exclude: ["@orbit/anki", "@orbit/api", "@orbit/db"],
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
          const bundledMigrationsRoot = resolve(desktopRoot, "out/main/chunks/migrations");
          const packagedMigrationsRoot = resolve(desktopRoot, "out/migrations");
          const packagedNativeBinding = resolve(desktopRoot, "out/native/better_sqlite3.node");

          if (!existsSync(betterSqliteNativeBinding)) {
            throw new Error(
              `Missing better-sqlite3 native binding at ${betterSqliteNativeBinding}`,
            );
          }

          rmSync(bundledMigrationsRoot, { force: true, recursive: true });
          cpSync(dbMigrationsRoot, bundledMigrationsRoot, { recursive: true });
          rmSync(packagedMigrationsRoot, { force: true, recursive: true });
          cpSync(dbMigrationsRoot, packagedMigrationsRoot, { recursive: true });

          mkdirSync(dirname(packagedNativeBinding), { recursive: true });
          copyFileSync(betterSqliteNativeBinding, packagedNativeBinding);
        },
        name: "copy-db-assets",
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
