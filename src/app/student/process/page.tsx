// `/student/process` (PROCESS): the whole thesis process and its forms (FR-TRK-01, FR-DOC-01, Task R4.6).
// Student only (FR-ACC-02): the portal layout refuses other roles, and this page checks the role again before any
// data call, the same as the other Student pages. One read: `studentTracker` (degree level, current milestone).
// No action on this page except form downloads (decision R4-b A: the blank forms in public/forms).
import { EmptyState } from "@/components/patterns/empty-state";
import { blankFormHref } from "@/lib/forms";
import { getRoleState } from "@/server/auth/session";
import { getDb } from "@/server/data/db";
import { studentTracker } from "@/server/data/tracker";
import { processPosition } from "./steps";
import { ProcessView } from "./view";

// Every form on this page is a TDW form with a blank file, so the link is never null here.
const formHref = (code: string) => blankFormHref(code) ?? "/forms";

export default async function Page() {
  const state = await getRoleState("student");
  if (state.status !== "ok") return null; // The portal layout already blocks this case.
  const t = await studentTracker({ db: getDb(), actor: state.actor });
  if (!t) {
    return (
      <div className="flex flex-col gap-8">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Thesis process</h1>
        <EmptyState title="Your thesis record is not open yet." body="The steps of your degree level appear here when the Coordinator opens your record." />
      </div>
    );
  }
  return <ProcessView degreeLevel={t.identity.degreeLevel} position={processPosition(t.current.code, t.current.status)} formHref={formHref} />;
}
