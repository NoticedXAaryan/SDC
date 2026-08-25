import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const nextCli = resolve("node_modules/next/dist/bin/next");
const result = spawnSync(process.execPath, [nextCli, "build"], {
  env: { ...process.env, SKIP_REDIS: "1" },
  stdio: "inherit",
});

if (result.status === 0) {
  const standaloneDir = resolve(".next/standalone");
  const staticDir = resolve(".next/static");
  const publicDir = resolve("public");

  // A standalone server does not copy browser assets automatically. Keeping
  // them beside server.js makes `npm start` match the production container.
  mkdirSync(resolve(standaloneDir, ".next"), { recursive: true });
  if (existsSync(staticDir)) {
    cpSync(staticDir, resolve(standaloneDir, ".next/static"), {
      recursive: true,
      force: true,
    });
  }
  if (existsSync(publicDir)) {
    cpSync(publicDir, resolve(standaloneDir, "public"), {
      recursive: true,
      force: true,
    });
  }
}

process.exit(result.status ?? 1);
