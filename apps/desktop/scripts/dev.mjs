import { spawn, spawnSync } from "node:child_process";

const rendererUrl = "http://127.0.0.1:5173";
const children = new Set();

const rebuild = spawnSync("pnpm", ["run", "rebuild:native"], {
  stdio: "inherit",
});

if (rebuild.status !== 0) {
  process.exit(rebuild.status ?? 1);
}

const renderer = spawn(
  "pnpm",
  ["exec", "react-router", "dev", "--host", "127.0.0.1", "--port", "5173", "--strictPort"],
  {
    stdio: "inherit",
  },
);

const electron = spawn(
  "pnpm",
  ["exec", "electron-vite", "--watch", "--config", "electron.vite.config.ts"],
  {
    env: {
      ...process.env,
      ORBIT_RENDERER_URL: rendererUrl,
    },
    stdio: "inherit",
  },
);

children.add(renderer);
children.add(electron);

let isShuttingDown = false;

for (const child of children) {
  child.on("exit", (code, signal) => {
    children.delete(child);

    if (!isShuttingDown) {
      shutdown(code ?? (signal ? 1 : 0));
    }
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => shutdown(0));
}

function shutdown(code) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const child of children) {
    child.kill("SIGTERM");
  }

  process.exit(code);
}
