// Small CSS readers for the token tests (R1.1). The token file keeps one declaration a line or several
// `--name: value;` pairs on a line, with no nested blocks inside :root or .dark.

/** The body of the first block whose selector list holds `selector` (for example ":root" or ".dark"). */
export function block(css: string, selector: string): string {
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(^|\n)([^{}\n][^{}]*?)\{([^{}]*)\}/g)) {
    if (m[2]!.split(",").map((s) => s.trim()).includes(selector)) return m[3]!;
  }
  throw new Error(`no ${selector} block`);
}

/** Every custom property in `css`. A later declaration wins, as in CSS. */
export function declarations(css: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    out.set(m[1]!, m[2]!.trim());
  }
  return out;
}

/** Resolve `var(--x)` chains against the primitive and theme maps. */
export function resolve(value: string, ...maps: Map<string, string>[]): string {
  let v = value;
  for (let i = 0; i < 10; i++) {
    const m = /^var\((--[a-z0-9-]+)\)$/i.exec(v);
    if (!m) return v;
    const next = maps.map((map) => map.get(m[1]!)).find((x) => x !== undefined);
    if (next === undefined) throw new Error(`unresolved ${m[1]}`);
    v = next;
  }
  throw new Error(`var loop at ${value}`);
}

/** WCAG 2 contrast ratio of two #RRGGBB colors. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const n = hex.replace("#", "");
    if (!/^[0-9a-f]{6}$/i.test(n)) throw new Error(`not a #RRGGBB color: ${hex}`);
    const [r, g, bl] = [0, 2, 4].map((i) => {
      const c = parseInt(n.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}
