import { createRequire } from "node:module";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";

const betterSqliteVersion = "12.11.1";
const desktopRoot = resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const sourceBetterSqliteRoot = dirname(require.resolve("better-sqlite3/package.json"));
const sourceBetterSqliteDepsRoot = dirname(sourceBetterSqliteRoot);
const nativeRoot = resolve(desktopRoot, ".electron-native");
const electronGypRoot = resolve(desktopRoot, ".electron-gyp");
const nativeNodeModulesRoot = resolve(nativeRoot, "node_modules");
const nativeBetterSqliteRoot = resolve(nativeNodeModulesRoot, "better-sqlite3");
const nativeBinaryPath = resolve(
  nativeRoot,
  "node_modules/better-sqlite3/build/Release/better_sqlite3.node",
);
const sourceBuildRoot = resolve(sourceBetterSqliteRoot, "build");
const metadataPath = resolve(nativeRoot, ".build.json");
const electronPackagePath = resolve(desktopRoot, "node_modules/electron/package.json");
const electronVersion = JSON.parse(readFileSync(electronPackagePath, "utf8")).version;
const metadata = {
  arch: process.arch,
  betterSqliteVersion,
  electronVersion,
};

process.env.npm_config_devdir = electronGypRoot;
process.env.HOME = desktopRoot;

if (isPrepared()) {
  console.log(`Reusing better-sqlite3 Electron build for Electron ${electronVersion}.`);
  process.exit(0);
}

rmSync(nativeRoot, { force: true, recursive: true });
mkdirSync(nativeNodeModulesRoot, { recursive: true });
writeFileSync(
  resolve(nativeRoot, "package.json"),
  `${JSON.stringify(
    {
      name: "@orbit/desktop-native",
      private: true,
      dependencies: {
        "better-sqlite3": betterSqliteVersion,
      },
    },
    null,
    2,
  )}\n`,
);

cpSync(sourceBetterSqliteRoot, nativeBetterSqliteRoot, {
  dereference: false,
  filter(source) {
    return source !== sourceBuildRoot && !source.startsWith(`${sourceBuildRoot}/`);
  },
  recursive: true,
});
linkDependency("bindings");
linkDependency("prebuild-install");

const { rebuild } = await import("@electron/rebuild");

await rebuild({
  arch: process.arch,
  buildPath: nativeRoot,
  electronVersion,
  force: true,
  mode: "sequential",
  onlyModules: ["better-sqlite3"],
  projectRootPath: desktopRoot,
  types: ["prod"],
});

writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

function isPrepared() {
  if (!existsSync(nativeBinaryPath) || !existsSync(metadataPath)) {
    return false;
  }

  try {
    const currentMetadata = JSON.parse(readFileSync(metadataPath, "utf8"));
    return (
      currentMetadata.arch === metadata.arch &&
      currentMetadata.betterSqliteVersion === metadata.betterSqliteVersion &&
      currentMetadata.electronVersion === metadata.electronVersion
    );
  } catch {
    return false;
  }
}

function linkDependency(name) {
  const source = resolve(sourceBetterSqliteDepsRoot, name);
  const destination = resolve(nativeNodeModulesRoot, name);
  symlinkSync(relative(nativeNodeModulesRoot, source), destination, "dir");
}
