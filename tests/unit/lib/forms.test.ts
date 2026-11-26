// R4.6, decision R4-b A (UX-P-04): the blank TDW forms are static files in public/forms (DESIGN.md §8.12).
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blankFormHref } from "@/lib/forms";

describe("blankFormHref (R4-b A)", () => {
  it("gives the public link of each of the 13 blank TDW forms, and the file exists", () => {
    for (let n = 1; n <= 13; n++) {
      const code = `TDW_${String(n).padStart(2, "0")}`;
      const href = blankFormHref(code);
      expect(href).toBe(`/forms/TDW-${String(n).padStart(2, "0")}.doc`);
      expect(existsSync(`public${href}`), href!).toBe(true);
    }
  });

  it("gives null for a record with no blank form (OR, Minutes, evidence)", () => {
    for (const code of ["OR", "MINUTES", "CERTIFICATION", "FINAL_COPY", "TDW_14"]) expect(blankFormHref(code)).toBeNull();
  });
});
