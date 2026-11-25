// `/student/clearance` (S6): the exit checklist of the Final milestone (FR-CLR-01, FR-CLR-02, FR-CLR-04).
// The Student uploads evidence on the Documents page. The Coordinator verifies it. The portal layout checks the role.
import Link from "next/link";
import { ClearanceList } from "@/app/_components/clearance-list";
import { EmptyState } from "@/components/empty-state";
import { getRoleState } from "@/server/auth/session";
import { clearanceView } from "@/server/data/clearance";
import { getDb } from "@/server/data/db";
import { readableMilestones } from "@/server/data/documents";

export default async function Page() {
  const state = await getRoleState("student");
  if (state.status !== "ok") return null;
  const ctx = { db: getDb(), actor: state.actor };
  const final = (await readableMilestones(ctx)).find((m) => m.code === "final");
  const view = final ? await clearanceView(ctx, final.id) : null;
  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-8 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Clearance</h1>
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          Each item must be done before the Coordinator closes your thesis as Cleared.{" "}
          <Link className="font-medium text-link underline-offset-4 hover:underline" href="/student/documents">
            Upload evidence on the Documents page.
          </Link>
        </p>
      </header>
      {view ? <ClearanceList rows={view.rows} /> : <EmptyState title="Clearance opens after the Final Defense." detail="Your checklist appears here." />}
    </main>
  );
}
