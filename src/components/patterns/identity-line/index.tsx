// Source: Primer repository header (DESIGN.md §5.2). The first line of a record screen: whose thesis this is.
// On the Student's own screens it shows the title and the degree level only. On A2, P2 and SV it names
// the thesis before a permanent gate action (UX-030).
import { cn } from "@/lib/utils";

export type IdentityLineProps = {
  title: string;
  degreeLevel: "masters" | "doctoral";
  adviser?: string;
  committee?: string[];
  /** The Student's own screen: title and degree level only. */
  ownView?: boolean;
  /** The Student's name, on screens of the other roles. */
  student?: string;
  className?: string;
};

const DEGREE = { masters: "Master’s", doctoral: "Doctoral" } as const;

export function IdentityLine({ title, degreeLevel, adviser, committee, ownView = false, student, className }: IdentityLineProps) {
  const facts = [
    !ownView && student ? student : null,
    DEGREE[degreeLevel],
    !ownView && adviser ? `Adviser ${adviser}` : null,
    !ownView && committee?.length ? `Committee: ${committee.join(", ")}` : null,
  ].filter(Boolean);
  return (
    <div data-slot="identity-line" className={cn("flex flex-col gap-1", className)}>
      <p className="font-serif text-xl leading-7 font-semibold text-balance text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{facts.join(" · ")}</p>
    </div>
  );
}
