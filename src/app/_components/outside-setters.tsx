// The outside statuses of one milestone: Ethics, IPMO, RPO and Copyright (FR-WFL-10, BR-14, INV-27).
// Every role sees them as read-only chips. The Coordinator sees a selector for each (C4, C7).
import { ActionForm, Field, inputClass } from "@/app/_components/action-form";
import { setOutsideAction } from "@/app/_lib/outside-actions";
import type { DataContext } from "@/server/data/access";
import { readOutsideStatuses } from "@/server/data/outside";
import { OUTSIDE_VALUES, type OutsideKind } from "@/server/data/schema";

const LABEL: Record<OutsideKind, string> = { ethics: "Ethics", ipmo: "IPMO", rpo: "RPO", copyright: "Copyright" };
const text = (v: string) => v.replaceAll("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase());

export async function OutsideSetters({ ctx, milestoneId }: { ctx: DataContext; milestoneId: string }) {
  const current = await readOutsideStatuses(ctx, milestoneId);
  const kinds = Object.keys(LABEL) as OutsideKind[];
  const coordinator = ctx.actor.role === "coordinator";
  return (
    <section aria-labelledby="outside" className="flex flex-col gap-3">
      <h2 id="outside" className="text-lg font-semibold">
        Outside statuses
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {kinds.map((kind) => (
          <li key={kind} className="flex flex-col gap-2 rounded-control border border-border p-3 text-sm">
            <p>
              <span className="font-medium">{LABEL[kind]}: </span>
              {text(current[kind])}
            </p>
            {coordinator ? (
              <ActionForm action={setOutsideAction.bind(null, milestoneId, kind)} submitLabel="Set" variant="outline" className="flex flex-wrap items-end gap-2" resetOnSuccess={false}>
                <Field label={`New ${LABEL[kind]} status`}>
                  <select name="value" defaultValue={current[kind]} className={inputClass}>
                    {OUTSIDE_VALUES[kind].map((v) => (
                      <option key={v} value={v}>
                        {text(v)}
                      </option>
                    ))}
                  </select>
                </Field>
              </ActionForm>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
