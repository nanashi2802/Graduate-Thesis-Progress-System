// The notification preferences panel in the user menu (FR-NTF-05, FR-NTF-09, INV-29, BR-18).
// Only optional events have a switch. Other events show "Always on" and the reason.
import { savePreferencesAction } from "@/app/_lib/notification-actions";
import { Button } from "@/components/ui/button";
import type { PreferenceRow } from "@/server/data/preferences";

export function PreferencesForm({ rows }: { rows: readonly PreferenceRow[] }) {
  return (
    <details data-slot="preferences">
      <summary className="cursor-pointer text-sm">Email preferences</summary>
      <form action={savePreferencesAction} className="mt-2 flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">You always get the in-app notification. These switches set the email.</p>
        <ul className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {rows.map((r) => (
            <li key={r.code} className="text-sm">
              {r.optional ? (
                <label className="flex items-start gap-2">
                  <input type="checkbox" name={`on_${r.code}`} defaultChecked={r.enabled} className="mt-1" />
                  <span>{r.event}</span>
                </label>
              ) : (
                <p>
                  {r.event}{" "}
                  <span className="text-xs text-muted-foreground">Always on. The system needs you to see this event.</span>
                </p>
              )}
            </li>
          ))}
        </ul>
        <Button type="submit" size="sm">
          Save
        </Button>
      </form>
    </details>
  );
}
