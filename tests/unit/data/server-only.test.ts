// P0-E02-T03: each data-layer module that runs queries is server only (NFR-01).
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dir = "src/server/data";
// schema.ts holds no query and no secret. drizzle-kit must load it outside Next.js.
const modules = readdirSync(dir).filter((f) => f.endsWith(".ts") && f !== "schema.ts");

// The optional carriage return keeps the test true on a CRLF checkout (Windows, core.autocrlf).
describe("src/server/data", () => {
  it.each(modules)("%s imports server-only", (file) => {
    expect(readFileSync(`${dir}/${file}`, "utf8")).toMatch(/^(\/\/.*\r?\n)*import "server-only";/);
  });

  it("accepts a module with CRLF line ends", () => {
    expect('// a\r\n// b\r\nimport "server-only";').toMatch(/^(\/\/.*\r?\n)*import "server-only";/);
  });
});
