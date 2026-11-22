// The revision items of one defense attempt (FR-REV-13): the list, the Student's commit link and each member's Accept.
// `RevisionItemsForm` is the Coordinator's entry form for the Minutes recommendations (C6).
import { ActionForm, areaClass, Field, inputClass } from "@/app/_components/action-form";
import { acceptItemAction, addItemsAction, linkItemAction } from "@/app/_lib/revision-actions";
import { EmptyState } from "@/components/empty-state";
import type { DataContext } from "@/server/data/access";
import { listRevisionItems } from "@/server/data/revisions";

export async function RevisionPanel({ ctx, attemptId, commits }: { ctx: DataContext; attemptId: string; commits: { id: string; ordinal: number }[] }) {
  const items = await listRevisionItems(ctx, attemptId);
  const role = ctx.actor.role;
  return (
    <section aria-labelledby="revisions" className="flex flex-col gap-3">
      <h2 id="revisions" className="text-lg font-semibold">
        Revision items
      </h2>
      {items.length === 0 ? (
        <EmptyState title="No revision items." detail="The Coordinator lists the recommendations of the Minutes here after a defense with revisions." />
      ) : (
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {items.map((i) => (
            <li key={i.id} className="flex flex-col gap-2 py-3 text-sm">
              <p>
                <span className="font-medium">{i.ordinal}.</span> {i.body}
              </p>
              <p className="text-muted-foreground">
                {i.linkedCommitOrdinal ? `Answered in v${i.linkedCommitOrdinal}.` : "The Student has not linked a commit."} {i.acceptedByUserIds.length} accepted{i.allAccepted ? " (all members)" : ""}.
              </p>
              {role === "student" && commits.length > 0 && !i.allAccepted ? (
                <ActionForm action={linkItemAction.bind(null, i.id)} submitLabel="Link commit" variant="outline" className="flex flex-wrap items-end gap-2" resetOnSuccess={false}>
                  <Field label="Commit that answers this item">
                    <select name="commitId" className={inputClass} defaultValue={commits.find((c) => c.ordinal === i.linkedCommitOrdinal)?.id ?? commits.at(-1)!.id}>
                      {commits.map((c) => (
                        <option key={c.id} value={c.id}>
                          v{c.ordinal}
                        </option>
                      ))}
                    </select>
                  </Field>
                </ActionForm>
              ) : null}
              {i.mine !== null ? (
                <ActionForm
                  action={acceptItemAction.bind(null, i.id)}
                  submitLabel={i.mine ? "Accepted" : "Accept this item"}
                  variant="outline"
                  blockedReason={i.mine ? "You accepted this item." : i.linkedCommitOrdinal ? undefined : "The Student has not linked a commit yet."}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function RevisionItemsForm({ attemptId }: { attemptId: string }) {
  return (
    <ActionForm action={addItemsAction.bind(null, attemptId)} submitLabel="Add revision items">
      <Field label="Recommendations of the Minutes (one revision item for each line)">
        <textarea name="items" required className={areaClass} />
      </Field>
    </ActionForm>
  );
}
