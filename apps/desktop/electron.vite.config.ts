import { defineConfig } from "electron-vite";
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";

const desktopRoot = import.meta.dirname;
const dbMigrationsRoot = resolve(desktopRoot, "../../packages/db/src/migrations");

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
          const cachedNativeBinding = resolve(
            desktopRoot,
            ".electron-native/node_modules/better-sqlite3/build/Release/better_sqlite3.node",
          );
          const packagedNativeBinding = resolve(desktopRoot, "out/native/better_sqlite3.node");

          rmSync(bundledMigrationsRoot, { force: true, recursive: true });
          cpSync(dbMigrationsRoot, bundledMigrationsRoot, { recursive: true });
          rmSync(packagedMigrationsRoot, { force: true, recursive: true });
          cpSync(dbMigrationsRoot, packagedMigrationsRoot, { recursive: true });

          if (existsSync(cachedNativeBinding)) {
            mkdirSync(dirname(packagedNativeBinding), { recursive: true });
            copyFileSync(cachedNativeBinding, packagedNativeBinding);
          }
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
