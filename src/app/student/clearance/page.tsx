// `/student/clearance` (S6): the exit checklist of the Final milestone (FR-CLR-01, FR-CLR-02, FR-CLR-04).
// The Student uploads evidence on the Documents page. The Coordinator verifies it. The portal layout checks the role.
// R4.6: the rows use the `task-list` pattern (DESIGN.md §7.4) with the same data. C7 keeps `ClearanceList` until R7d.
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { TaskList } from "@/components/patterns/task-list";
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
    <div className="mx-auto flex max-w-[960px] flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Clearance</h1>
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          Each item must be done before the Coordinator closes your thesis as Cleared.{" "}
          <Link className="font-medium text-link underline-offset-4 hover:underline" href="/student/documents">
            Upload evidence on the Documents page.
          </Link>
        </p>
      </header>
      {view ? (
        <TaskList
          groups={[
            {
              label: "Clearance items",
              items: view.rows.map((r) => ({
                id: r.kind,
                stamp: { kind: "status", tone: r.done ? "done" : "neutral", label: r.done ? "Done" : "Open" },
                label: r.label,
                reason: { text: r.source === "record" ? "Comes from its own record." : "The Coordinator verifies it.", kind: "note" },
              })),
            },
          ]}
        />
      ) : (
        <EmptyState title="Clearance opens after the Final Defense." detail="Your checklist appears here." />
      )}
    </div>
  );
}
