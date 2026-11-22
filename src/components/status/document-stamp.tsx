import { cn } from "@/lib/utils";
import { TONE_TEXT, ToneIcon } from "./tone-icon";
import { documentStateView, type DocumentState } from "./tones";

/** 2 px radius, white fill, form number in mono and the state (DESIGN.md §7.1). Example: `TDW 07` · Verified. */
export function DocumentStamp({
  form,
  state,
  className,
}: {
  form: string;
  state: DocumentState;
  className?: string;
}) {
  const view = documentStateView(state);
  return (
    <span
      data-slot="document-stamp"
      data-tone={view.tone}
      className={cn(
        "inline-flex items-center gap-2 rounded-stamp border border-neutral-300 bg-neutral-0 px-2 py-0.5 text-sm leading-5",
        className,
      )}
    >
      <span className="font-mono text-[13px] text-foreground">{form}</span>
      <span aria-hidden="true" className="text-neutral-400">
        ·
      </span>
      <span className={cn("inline-flex items-center gap-1 font-medium", TONE_TEXT[view.tone])}>
        <ToneIcon tone={view.tone} />
        {view.label}
      </span>
    </span>
  );
}
