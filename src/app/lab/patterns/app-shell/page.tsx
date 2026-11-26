// /lab/patterns/app-shell (Task R2.1): the shell of each role with mock facts. The page follows the lab theme
// switch (and the light or dark run of `pnpm lab:shots`). Query: ?role=student|adviser|panel_member|coordinator,
// ?drawer=open (tablet and phone: the drawer open), ?width=1200 (R2-c option B), ?look=neutral (R2-a option B),
// ?palette=1 (D-08 option B).
import Link from "next/link";
import { Suspense } from "react";
import type { NavRole } from "@/components/patterns/sidebar/nav";
import { LabHeader } from "../../_mock/panels";
import { ShellDemo } from "../../_mock/shell-demo";
import { ROLES, ROLE_LABEL } from "../../_mock/shell-facts";

// cacheComponents: the query is runtime data, so the part that reads it sits inside <Suspense>.
export default function Page(props: PageProps<"/lab/patterns/app-shell">) {
  return (
    <Suspense>
      <Variant {...props} />
    </Suspense>
  );
}

async function Variant({ searchParams }: PageProps<"/lab/patterns/app-shell">) {
  const raw = await searchParams;
  const q = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const role = ROLES.includes(q.role as NavRole) ? (q.role as NavRole) : "student";
  const link = (extra: Record<string, string>) => `/lab/patterns/app-shell?${new URLSearchParams({ role, ...extra })}`;
  return (
    <>
      <LabHeader
        title="App shell (R2.1)"
        round="R2 · UX-P-02"
        states={["skip link", "masthead rule", "56 px top bar", "240 px sidebar", "drawer below 1024 px", "content width (R2-c)", "D-08 controls"]}
      />
      <nav aria-label="Shell variants" className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {ROLES.map((r) => (
          <Link key={r} href={`/lab/patterns/app-shell?role=${r}`} className="text-link underline-offset-4 hover:underline" aria-current={r === role ? "page" : undefined}>
            {ROLE_LABEL[r]}
          </Link>
        ))}
        <span aria-hidden="true">·</span>
        <Link href={link({ drawer: "open" })} className="text-link underline-offset-4 hover:underline">Drawer open (below 1024 px)</Link>
        <Link href={link({ width: "1200" })} className="text-link underline-offset-4 hover:underline">R2-c option B (1200 px)</Link>
        <Link href={link({ look: "neutral" })} className="text-link underline-offset-4 hover:underline">R2-a option B (neutral)</Link>
        <Link href={link({ palette: "1" })} className="text-link underline-offset-4 hover:underline">D-08 option B (route palette, key /)</Link>
      </nav>
      <ShellDemo
        role={role}
        facts="milestone3"
        drawerOpen={q.drawer === "open"}
        contentWidth={q.width === "1200" ? 1200 : 1280}
        look={q.look === "neutral" ? "neutral" : "brand"}
        palette={q.palette === "1"}
      />
    </>
  );
}
