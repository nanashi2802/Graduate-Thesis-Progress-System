// Task 2.1 (IMPLEMENTATION_PLAN.md §7, UX-D-05): the /lab showcase is for development only.
// It returns a 404 in a production build, and it imports nothing from the server at run time.
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ESLint } from "eslint";
import { afterEach, describe, expect, it, vi } from "vitest";
// next/font only works inside the Next.js build. The lab fonts are stubbed: the guard does not depend on them.
vi.mock("next/font/google", () => {
  const font = () => ({ className: "", variable: "", style: { fontFamily: "" } });
  return Object.fromEntries(
    ["Poppins", "Inter", "JetBrains_Mono", "Source_Serif_4", "IBM_Plex_Sans", "IBM_Plex_Mono", "Source_Sans_3", "Source_Code_Pro", "Public_Sans", "Newsreader", "Atkinson_Hyperlegible_Next", "Atkinson_Hyperlegible_Mono"].map((n) => [n, font]),
  );
});

const { default: LabLayout } = await import("@/app/lab/layout");

const child = createElement("p", null, "lab page");

describe("/lab layout guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calls notFound in a production build", () => {
    vi.stubEnv("NODE_ENV", "production");
    let digest: unknown;
    try {
      LabLayout({ children: child });
    } catch (e) {
      digest = (e as { digest?: unknown }).digest;
    }
    expect(String(digest)).toMatch(/404/);
  });

  it("renders the page in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const html = renderToStaticMarkup(LabLayout({ children: child }) as ReactElement);
    expect(html).toContain("lab page");
    expect(html).toContain("Development only");
  });
});

describe("/lab import rule", () => {
  const eslint = new ESLint();
  const lint = async (code: string) => {
    const [result] = await eslint.lintText(code, { filePath: "src/app/lab/_mock/probe.tsx" });
    return result!.messages.filter((m) => m.ruleId === "@typescript-eslint/no-restricted-imports");
  };

  it.each([
    'import { getDb } from "@/server/data/db";',
    'import { commitUrl } from "@/app/_lib/pr-actions";',
    'import { signOut } from "@/app/(auth)/login/actions";',
  ])("refuses a run-time server import: %s", async (line) => {
    expect(await lint(`${line}\nexport const x = 1;\n`)).toHaveLength(1);
  });

  it("allows a type-only import from the server", async () => {
    expect(await lint('import type { DataContext } from "@/server/data/access";\nexport type X = DataContext;\n')).toHaveLength(0);
  });
});
