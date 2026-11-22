// P0-E02-T03: each data-layer module that runs queries is server only (NFR-01).
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dir = "src/server/data";
// schema.ts holds no query and no secret. drizzle-kit must load it outside Next.js.
const modules = readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "schema.ts");

describe("src/server/data", () => {
  it.each(modules)("%s imports server-only", (file) => {
    expect(readFileSync(`${dir}/${file}`, "utf8")).toMatch(/^(\/\/.*\n)*import "server-only";/);
  });
});
