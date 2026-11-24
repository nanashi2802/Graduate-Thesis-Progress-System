// Illustrative product screens for the landing page. Sample content only (AGENTS.md §11).
// They show how ThesIsko looks; they are not live data and they make no claim about real users.
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  FileText,
  LayoutDashboard,
  SendHorizontal,
  Settings,
} from "lucide-react";
import { Wordmark } from "./wordmark";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "My Thesis", icon: BookOpen },
  { label: "Schedule", icon: CalendarDays },
  { label: "Notifications", icon: Bell },
  { label: "Settings", icon: Settings },
];

const JOURNEY = [
  { label: "Proposal", done: true },
  { label: "Pre-Final", done: true },
  { label: "Final", done: true },
  { label: "Clearance", done: false },
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

/** Hero screen: the student dashboard with the thesis journey. */
export function DashboardMockup() {
  return (
    <div className="landing-window overflow-hidden rounded-2xl bg-white">
      <div className="flex min-h-[19rem]">
        <aside className="hidden w-36 shrink-0 border-r border-neutral-200 bg-neutral-50 px-3 py-4 sm:block">
          <Wordmark className="text-[15px]" />
          <ul className="mt-5 space-y-1">
            {NAV.map(({ label, icon: Icon, active }) => (
              <li
                key={label}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px]",
                  active ? "bg-maroon-50 font-semibold text-maroon-700" : "text-neutral-600",
                )}
              >
                <Icon aria-hidden="true" strokeWidth={1.5} className="size-3.5" />
                {label}
              </li>
            ))}
          </ul>
        </aside>
        <div className="flex-1 px-5 py-4">
          <p className="text-[14px] font-semibold text-neutral-900">Thesis Journey</p>
          <ol className="relative mt-4 grid grid-cols-4">
            <span aria-hidden="true" className="absolute top-[11px] right-[12.5%] left-[12.5%] h-0.5 bg-neutral-200" />
            <span aria-hidden="true" className="absolute top-[11px] left-[12.5%] h-0.5 w-[50%] bg-maroon-600" />
            {JOURNEY.map((step) => (
              <li key={step.label} className="relative flex flex-col items-center gap-1.5 text-center">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full",
                    step.done ? "bg-maroon-600 text-white" : "border-2 border-neutral-300 bg-white",
                  )}
                >
                  {step.done ? <Check strokeWidth={2.5} className="size-3.5" /> : null}
                </span>
                <span className="text-[10.5px] leading-tight text-neutral-700">{step.label}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2.5">
            <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full bg-tone-done-fg text-white">
              <Check strokeWidth={2.5} className="size-3.5" />
            </span>
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-neutral-900">Final Defense completed</p>
              <p className="text-[11px] text-neutral-600">Next step: clearance</p>
            </div>
            <span className="rounded-md bg-maroon-600 px-2.5 py-1 text-[11px] font-medium text-white">View details</span>
          </div>
          <p className="mt-4 text-[11px] font-semibold text-neutral-500">Latest activity</p>
          <ul className="mt-2 divide-y divide-neutral-100">
            <li className="flex items-center gap-2.5 py-2">
              <Initials name="DS" />
              <div className="flex-1">
                <p className="text-[12px] text-neutral-800">Dr. Santos commented on v2.0</p>
                <p className="text-[10.5px] text-neutral-500">Nov 20, 2026 · 10:45 AM</p>
              </div>
            </li>
            <li className="flex items-center gap-2.5 py-2">
              <Initials name="JD" />
              <div className="flex-1">
                <p className="text-[12px] text-neutral-800">New file uploaded (Chapter 4)</p>
                <p className="text-[10.5px] text-neutral-500">Nov 20, 2026 · 9:12 AM</p>
              </div>
            </li>
          </ul>
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
