// /lab/patterns/top-bar (Task R2.2, D-08): the top-bar controls with mock actions. The sheets and the menu open in
// the page theme (they render in a portal). ?open=notifications shows the notification sheet open.
import { Suspense } from "react";
import { ToastCard } from "@/components/patterns/toast";
import { Demo, LabHeader, ThemePanels } from "../../_mock/panels";
import { TopBarDemo } from "../../_mock/r2-demos";

const OPTIONS = [
  { id: "A", rec: true, text: "Notifications in a right side sheet (Base UI drawer). User menu (Base UI menu) with Email preferences in a side sheet and Sign out. No search: no search feature exists." },
  { id: "B", rec: false, text: "Option A plus a route palette: the / key or the search glyph opens a dialog that jumps to a sidebar page. It finds pages, not records. See /lab/patterns/app-shell?palette=1." },
  { id: "C", rec: false, text: "Keep today's drop-down panels (details elements) and only restyle them. No focus trap, no Escape on the bell panel." },
];

export default function Page(props: PageProps<"/lab/patterns/top-bar">) {
  return (
    <Suspense>
      <Body {...props} />
    </Suspense>
  );
}

// cacheComponents: the query is runtime data, so the part that reads it sits inside <Suspense>.
async function Body({ searchParams }: PageProps<"/lab/patterns/top-bar">) {
  const q = await searchParams;
  return (
    <>
      <LabHeader
        title="Top bar (R2.2, D-08)"
        round="R2 · UX-P-02"
        states={["bell with 2 unread", "bell with none unread", "notification sheet", "user menu", "email preferences sheet", "toast after save"]}
      />
      <p className="mb-4 max-w-[72ch] rounded-card border border-border bg-accent px-4 py-3 text-sm text-accent-foreground">
        Decided at UX-P-02 (26 Nov 2026): option A, plus a route or command palette. The palette features and scope are open for a later discussion.
      </p>
      <Demo title="D-08 options">
        <ol className="flex max-w-[72ch] flex-col gap-2 text-sm">
          {OPTIONS.map((o) => (
            <li key={o.id}>
              <span className="font-semibold">Option {o.id}{o.rec ? " (recommended)" : ""}:</span> {o.text}
            </li>
          ))}
        </ol>
      </Demo>
      <div className="mt-6">
        <ThemePanels>
          <Demo title="Option A controls: bell (2 unread), bell (none), user menu. Open each; Escape closes; focus returns.">
            <TopBarDemo open={q.open === "notifications" ? "notifications" : undefined} />
          </Demo>
          <Demo title="Unread badge: 12.8 px (UX-005; today 11 px)">
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.8rem] leading-5 font-semibold text-primary-foreground">2</span>
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.8rem] leading-5 font-semibold text-primary-foreground">9+</span>
          </Demo>
          <Demo title="After Save in Email preferences">
            <div className="w-80">
              <ToastCard label="Preferences saved." tone="done" />
            </div>
          </Demo>
        </ThemePanels>
      </div>
    </>
  );
}
