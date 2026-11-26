// Source: Stripe forms (UX-D-03), DESIGN.md §10 Forms, §8.4 (UX-D-16), UX-012, UX-013, Task R3.7.
// The label sits above the control. One fixed-height slot under the control holds the error, else the hint.
// Both are linked with aria-describedby, and the control gets aria-invalid with an error. When the error shows,
// the hint stays in the DOM for screen readers. Contract (UX-011): an error the server names for a field shows
// here (role="alert"); any other error and every result show in the form's FormFeedback slot. One control class set for input, select and textarea.
import { cloneElement, isValidElement, type AriaAttributes, type ReactElement, type ReactNode } from "react";
import { Glyph } from "@/components/patterns/glyphs";
import { cn } from "@/lib/utils";

const BASE =
  "w-full rounded-control border border-input bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-tone-returned-fg disabled:opacity-60";

/** 44 px below 1024 px (tablet targets), 36 px at laptop, the button height. */
export const control = {
  input: cn(BASE, "h-11 lg:h-9"),
  select: cn(BASE, "h-11 lg:h-9 pr-8"),
  textarea: cn(BASE, "min-h-24 py-2 leading-5"),
} as const;

export const hintId = (id: string) => `${id}-hint`;
export const fieldErrorId = (id: string) => `${id}-error`;

export type FormFieldProps = {
  label: string;
  /** The id of the control. The label, the hint and the error use it. */
  id: string;
  hint?: string;
  /** A server error that names this field. One fact in 25 words or fewer (DESIGN.md §9). */
  error?: string;
  /** One control: input, select or textarea. */
  children: ReactElement<Pick<AriaAttributes, "aria-describedby" | "aria-invalid"> & { id?: string }>;
  /** Leave the slot out for a field with no hint and no possible error (a checkbox row). */
  reserve?: boolean;
  /** The slot height in 20 px lines: 1 (default) or 2 for a narrow field or a long hint. The same in every state. */
  lines?: 1 | 2;
  className?: string;
};

export function FormField({ label, id, hint, error, children, reserve = true, lines = 1, className }: FormFieldProps) {
  const describedBy = [error ? fieldErrorId(id) : null, hint ? hintId(id) : null].filter(Boolean).join(" ") || undefined;
  const controlEl = isValidElement(children)
    ? cloneElement(children, { id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })
    : children;
  return (
    <div data-slot="form-field" className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {controlEl}
      {reserve || hint || error ? <FieldMessage id={id} hint={hint} error={error} lines={lines} /> : null}
    </div>
  );
}

/** One or two lines of 20 px, the same height in every state, so a server error does not move the form (UX-D-16). */
function FieldMessage({ id, hint, error, lines }: { id: string; hint?: string; error?: string; lines: 1 | 2 }): ReactNode {
  const clamp = lines === 1 ? "line-clamp-1" : "line-clamp-2";
  return (
    <div data-slot="field-message" className={cn("-mt-1 text-[0.8rem] leading-5", lines === 1 ? "h-5" : "h-10")}>
      {error ? (
        <p id={fieldErrorId(id)} role="alert" className="flex items-start gap-1.5 font-medium text-tone-returned-fg">
          <Glyph name="flag" size={16} className="mt-0.5 shrink-0" />
          <span className={cn("min-w-0", clamp)}>{error}</span>
        </p>
      ) : null}
      {hint ? (
        <p id={hintId(id)} className={error ? "sr-only" : cn("text-muted-foreground", clamp)}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
