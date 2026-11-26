"use client";
// Source: UX-D-04, DESIGN.md §6.1, Base UI toast (installed, 1.9.0), Task R2.3.
// One polite region (role="status" from Base UI). 4 s, then it closes; hover and focus pause the timer (Base UI).
// Glyph and label, tokens only. Motion: D-10 option A (160 ms fade and 8 px rise). Reduced motion: no movement.
// Put `ToastProvider` in the root layout at Integrate (R2.8). Until then only /lab uses it.
import { Toast } from "@base-ui/react/toast";
import { X } from "lucide-react";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Glyph } from "@/components/patterns/glyphs";
import { cn } from "@/lib/utils";
import { toastOptions, type ToastData, type ToastInput } from "./options";

export { TOAST_TIMEOUT_MS, toastOptions, type ToastInput, type ToastTone } from "./options";

const TONE_CLASS: Record<string, string> = {
  done: "text-tone-done-fg",
  returned: "text-tone-returned-fg",
  neutral: "text-muted-foreground",
};

const CARD = "flex w-full items-center gap-3 rounded-card border border-border bg-popover px-4 py-3 text-popover-foreground shadow-[var(--shadow-popover)]";
const MOTION =
  "transition-[opacity,transform] duration-(--motion-toast) ease-out data-ending-style:translate-y-2 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0 motion-reduce:transition-none motion-reduce:data-ending-style:translate-y-0 motion-reduce:data-starting-style:translate-y-0";

/** The toast look without the live region, for /lab. */
export function ToastCard({ label, tone, glyph }: ToastInput) {
  const o = toastOptions({ label, tone, glyph });
  return (
    <div className={CARD}>
      <span className={cn("shrink-0", TONE_CLASS[tone])}>
        <Glyph name={o.data.glyph} size={20} />
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium">{label}</p>
    </div>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager<ToastData>();
  return toasts.map((t) => (
    <Toast.Root
      key={t.id}
      toast={t}
      className={cn(CARD, MOTION)}
    >
      <span className={cn("shrink-0", TONE_CLASS[t.type ?? "neutral"])}>
        <Glyph name={t.data?.glyph ?? "commit"} size={20} />
      </span>
      <Toast.Title className="min-w-0 flex-1 text-sm font-medium" />
      <Toast.Close
        aria-label="Close"
        className="flex size-8 shrink-0 items-center justify-center rounded-control text-muted-foreground outline-none hover:bg-muted focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <X aria-hidden="true" strokeWidth={1.75} className="size-4" />
      </Toast.Close>
    </Toast.Root>
  ));
}

type Show = (t: ToastInput) => void;
// Our own context: `useToast` outside a provider gives a no-op instead of a crash (Base UI throws there).
const ShowContext = createContext<Show | null>(null);

function Bridge({ children }: { children: ReactNode }) {
  const manager = Toast.useToastManager<ToastData>();
  const show = useMemo<Show>(() => (t) => void manager.add(toastOptions(t)), [manager]);
  return <ShowContext.Provider value={show}>{children}</ShowContext.Provider>;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider limit={3}>
      <Bridge>{children}</Bridge>
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 bottom-4 z-50 flex w-[calc(100vw-2rem)] flex-col gap-2 sm:w-[22.5rem]">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

const NOOP: Show = () => {};

/** `show` adds a toast. Outside a `ToastProvider` it does nothing. */
export function useToast(): { show: Show } {
  return { show: useContext(ShowContext) ?? NOOP };
}
