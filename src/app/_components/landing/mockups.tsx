// Illustrative product screens for the landing page. Sample content only (AGENTS.md §11).
// They show how ThesIsko looks; they are not live data and they make no claim about real users.
import type { CSSProperties } from "react";
import { Check, CircleCheck, FileText, SendHorizontal, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const JOURNEY: { label: string; icon: LucideIcon }[] = [
  { label: "Proposal", icon: FileText },
  { label: "Pre-Final", icon: Users },
  { label: "Final", icon: ShieldCheck },
  { label: "Clearance", icon: CircleCheck },
];

function Initials({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-maroon-100 text-[11px] font-semibold text-maroon-800"
    >
      {name}
    </span>
  );
}

/**
 * Hero card: the thesis journey, the core of the app, with no app chrome around it.
 * On load the track fills from the Proposal to clearance and each milestone checks off in
 * turn (`.hj-*` in landing.css). The hero text builds after it. Without motion it shows at rest.
 */
export function HeroJourney() {
  return (
    <div className="hero-journey landing-window rounded-2xl bg-white p-5 sm:p-6">
      <p className="text-xs font-semibold tracking-[0.14em] text-neutral-500 uppercase">Thesis journey</p>
      <ol className="relative mt-5 grid grid-cols-4">
        <span aria-hidden="true" className="absolute top-5 right-[12.5%] left-[12.5%] h-0.5 rounded-full bg-neutral-200" />
        <span
          aria-hidden="true"
          className="hj-fill absolute top-5 right-[12.5%] left-[12.5%] h-0.5 origin-left rounded-full bg-maroon-600"
        />
        {JOURNEY.map(({ label, icon: Icon }, i) => (
          <li key={label} className="relative flex flex-col items-center gap-2 text-center">
            <span aria-hidden="true" className="relative size-10">
              <span className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-neutral-200 bg-white text-neutral-400">
                <Icon strokeWidth={1.5} className="size-[18px]" />
              </span>
              {i === JOURNEY.length - 1 ? <span className="hj-ring absolute inset-0 rounded-full border-2 border-gold-400" /> : null}
              <span
                className="hj-done absolute inset-0 flex items-center justify-center rounded-full bg-maroon-600 text-white"
                style={{ "--n": i } as CSSProperties}
              >
                <Check strokeWidth={2.5} className="size-[18px]" />
              </span>
            </span>
            <span className="text-[13px] leading-tight font-medium text-neutral-800">{label}</span>
          </li>
        ))}
      </ol>
      <div className="hj-status mt-6 flex items-center gap-3 rounded-xl bg-tone-done-bg px-4 py-3">
        <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-tone-done-fg text-white">
          <Check strokeWidth={2.5} className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-neutral-900">Clearance complete</p>
          <p className="text-xs text-neutral-600">Each milestone is closed and on record.</p>
        </div>
      </div>
    </div>
  );
}

const VERSIONS = [
  { tag: "v3.0", name: "Final draft", date: "Nov 20, 2026 · 2:14 PM", latest: true },
  { tag: "v2.0", name: "Revised draft", date: "Nov 12, 2026 · 10:32 AM" },
  { tag: "v1.0", name: "Initial draft", date: "Nov 3, 2026 · 9:17 AM" },
];

/** Versions screen: the version list beside one pinned comment thread. */
export function VersionsMockup() {
  return (
    <div className="relative grid gap-4 sm:grid-cols-[0.9fr_1.1fr] sm:items-start">
      <div className="landing-window rounded-2xl bg-white p-4">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-neutral-900">
          <FileText aria-hidden="true" strokeWidth={1.5} className="size-4 text-maroon-600" />
          Manuscript versions
        </p>
        <ol className="relative mt-4 space-y-5 border-l border-neutral-200 pl-4">
          {VERSIONS.map((v) => (
            <li key={v.tag} className="relative">
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-1 -left-[21px] size-2.5 rounded-full",
                  v.latest ? "bg-gold-500 ring-4 ring-gold-100" : "bg-neutral-300",
                )}
              />
              <p className="flex items-center gap-2 text-[12.5px]">
                <span className={cn("font-mono", v.latest ? "text-maroon-700" : "text-neutral-700")}>{v.tag}</span>
                <span className={v.latest ? "font-semibold text-maroon-700" : "text-neutral-800"}>{v.name}</span>
                {v.latest ? (
                  <span className="ml-auto rounded-full bg-tone-done-bg px-2 py-0.5 text-[10.5px] font-medium text-tone-done-fg">
                    Latest
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-500">{v.date}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="landing-window rounded-2xl bg-white p-4 sm:mt-10">
        <p className="text-[13px] font-semibold text-neutral-900">
          Comments on <span className="font-mono text-maroon-700">v2.0</span>
        </p>
        <p className="mt-3 rounded-md border-l-2 border-gold-500 bg-gold-50 px-3 py-2 text-[12px] leading-relaxed text-neutral-700">
          “This study aims to improve the performance of the system using a lightweight model.”
        </p>
        <ul className="mt-3 space-y-3">
          <li className="flex gap-2.5">
            <Initials name="DS" />
            <div>
              <p className="text-[12px] font-semibold text-neutral-900">
                Dr. Santos <span className="font-normal text-neutral-500">· Adviser</span>
              </p>
              <p className="text-[12px] text-neutral-700">Please elaborate on the methodology section.</p>
            </div>
          </li>
          <li className="flex gap-2.5">
            <Initials name="JD" />
            <div>
              <p className="text-[12px] font-semibold text-neutral-900">
                Juan <span className="font-normal text-neutral-500">· Student</span>
              </p>
              <p className="text-[12px] text-neutral-700">
                Expanded in <span className="font-mono text-maroon-700">v3.0</span>, section 3.2.
              </p>
            </div>
          </li>
        </ul>
        <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-neutral-200 px-3 py-2">
          <span className="text-[11.5px] text-neutral-400">Add a reply…</span>
          <span aria-hidden="true" className="flex size-6 items-center justify-center rounded bg-maroon-600 text-white">
            <SendHorizontal strokeWidth={1.5} className="size-3.5" />
          </span>
        </div>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-tone-done-bg px-2.5 py-1 text-[11px] font-medium text-tone-done-fg">
          <Check aria-hidden="true" strokeWidth={2.5} className="size-3" />
          Resolved by the adviser in v3.0
        </p>
      </div>
    </div>
  );
}
