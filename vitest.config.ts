import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";
import path from "node:path";

function loadDotEnv(file: string): Record<string, string> {
  try {
    const raw = readFileSync(path.resolve(process.cwd(), file), "utf8");
    const out: Record<string, string> = {};
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*?)"?\s*$/);
      if (m) out[m[1]] = m[2];
    }
    return out;
  } catch { return {}; }
}

const env = loadDotEnv(".env");

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: { DATABASE_URL: env.DATABASE_URL ?? "file:./dev.db" },
  },
});
