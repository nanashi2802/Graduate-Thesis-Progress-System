import { cn } from "@/lib/utils";

/**
 * Text wordmark "ThesIsko" (Thesis + Isko, from Iskolar ng Bayan).
 * "Isko" is set in maroon, so the word shows its two parts (DESIGN.md §1.3).
 * Text only: no PUP logo, seal or symbol (DESIGN.md P9).
 */
export function Wordmark({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <span className={cn("font-serif font-semibold tracking-[-0.01em]", onDark ? "text-white" : "text-foreground", className)}>
      Thes<span className={onDark ? "text-gold-300" : "text-maroon-600"}>Isko</span>
    </span>
  );
}
