/*
 * DIRECTION CONTRACT (impeccable; the owner's reference design pins the world, 23 Nov 2026)
 * THESIS: One clear path for every thesis. A bright, product-led page: the student dashboard
 *   floats over the campus, and every section shows the product doing its job.
 * OWN-WORLD: White ground, PUP maroon for actions and emphasis, gold for highlights and the
 *   result quote. IBM Plex Sans headings and body, Source Serif 4 for the wordmark and the quote.
 *   Floating product windows with layered soft shadows; soft tinted panels; a dark result band.
 * STORY: Faculty and Graduate School users see one path from proposal to clearance, see how
 *   versions keep feedback, see a place for every role, and sign in.
 * FIRST VIEWPORT: Header (wordmark, section links, Sign in pill). Left: eyebrow, "Your thesis.
 *   One clear path.", one paragraph, Sign in. Right: campus photo slot with the dashboard
 *   window and the gold "One status. One version. One next action." note, all over a full-bleed
 *   campus drone shot under a neutral dark scrim (owner feedback, 23 Nov 2026).
 * FORM: Owner's reference (pinned), replacing the Route Board roll (seed a9bfe9cc). Code-led.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review,
 *   the verdict, DESIGN.md, and every shipping raster carrying its provenance.
 */
import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Source_Serif_4 } from "next/font/google";
import {
  ArrowDown,
  ArrowRight,
  CircleCheck,
  FileSignature,
  FileText,
  LogIn,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureCards } from "./_components/landing/feature-cards";
import GradualBlur from "./_components/landing/gradual-blur";
import { DashboardMockup, VersionsMockup } from "./_components/landing/mockups";
import { RoleSwitcher } from "./_components/landing/role-switcher";
import { StrokeWordmark } from "./_components/landing/stroke-wordmark";
import { TechTitle } from "./_components/landing/tech-title";
import { Wordmark } from "./_components/landing/wordmark";
import "./landing.css";

// The italic quote needs the italic face; it loads on this route only.
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600"],
  style: ["normal", "italic"],
  variable: "--font-landing-serif",
  display: "swap",
});

// The title comes from the root layout (DESIGN.md §1.3).
export const metadata: Metadata = {
  description:
    "ThesIsko keeps every graduate thesis on one clear path, from proposal to clearance. Everyone sees the same status, the same version and the next step.",
};

const NAV = [
  { label: "Home", href: "#top" },
  { label: "About", href: "#journey" },
  { label: "Features", href: "#versions" },
  { label: "For Users", href: "#roles" },
];

type Milestone = {
  name: string;
  icon: LucideIcon;
  status: string;
  badge: string;
  disc: string;
};

// Status colors are the app's own tones (DESIGN.md §3.3).
const MILESTONES: Milestone[] = [
  {
    name: "Proposal Defense",
    icon: FileText,
    status: "Completed",
    badge: "bg-tone-done-bg text-tone-done-fg",
    disc: "bg-tone-done-fg text-white",
  },
  {
    name: "Pre-Final Defense",
    icon: Users,
    status: "In progress",
    badge: "bg-tone-pending-bg text-tone-pending-fg",
    disc: "bg-gold-500 text-white",
  },
  {
    name: "Final Defense",
    icon: ShieldCheck,
    status: "Pending",
    badge: "bg-neutral-100 text-neutral-600",
    disc: "bg-neutral-600 text-white",
  },
  {
    name: "Clearance",
    icon: CircleCheck,
    status: "Upcoming",
    badge: "bg-neutral-100 text-neutral-600",
    disc: "bg-neutral-400 text-white",
  },
];

const STEPS: { label: string; icon: LucideIcon }[] = [
  { label: "Upload manuscript", icon: Upload },
  { label: "Adviser review", icon: UserRound },
  { label: "Panel feedback", icon: MessageSquareText },
  { label: "Revisions", icon: RefreshCw },
  { label: "Signed form clearance", icon: FileSignature },
];


const GIVES = [
  "One shared status for everyone",
  "Feedback tied to each version",
  "A clear next step at every stage",
  "Every consultation on record",
];

function Eyebrow({ children, className }: { children: string; className?: string }) {
  return (
    <p className={cn("text-xs font-semibold tracking-[0.14em] text-maroon-600 uppercase", className)}>{children}</p>
  );
}

/** `build`: draw the outline of the pill on load, then fill it (`.hero-build` in landing.css). */
function SignInButton({ className, build = false }: { className?: string; build?: boolean }) {
  return (
    <Link href="/login" className={cn("landing-cta", className)}>
      {build ? (
        <svg aria-hidden="true" focusable="false" className="hero-cta-outline">
          <rect x="0" y="0" width="100%" height="100%" rx="24" pathLength="100" />
        </svg>
      ) : null}
      <span>Sign in</span>
      <ArrowRight aria-hidden="true" strokeWidth={2} className="size-4" />
    </Link>
  );
}

export default function Home() {
  return (
    <div id="top" className={cn(serif.variable, "landing flex flex-1 flex-col")}>
      {/* Header */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-5 sm:px-8">
        <Link
          href="#top"
          aria-label="ThesIsko home"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400"
        >
          <StrokeWordmark onDark className="text-[1.85rem] leading-none" />
        </Link>
        <nav aria-label="Page sections" className="hidden md:block">
          <ul className="flex items-center gap-8 text-[15px] text-white/85">
            {NAV.map((item, i) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={cn(
                    "rounded py-1 transition-colors duration-150 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400",
                    i === 0 && "border-b-2 border-gold-400 font-medium text-white",
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          href="/login"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-maroon-600 px-5 py-2.5 text-[15px] font-semibold whitespace-nowrap text-white transition-colors duration-150 hover:bg-maroon-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
        >
          <LogIn aria-hidden="true" strokeWidth={2} className="size-4" />
          Sign in
        </Link>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section aria-labelledby="hero-title" className="relative -mt-[87px] overflow-hidden bg-[#0c0c0c] pt-[87px]">
          {/* Full-bleed drone shot of the Main Building, cropped to keep the new tower out of frame. */}
          <div aria-hidden="true" className="landing-hero-photo absolute inset-x-0 top-0 h-[44rem] max-h-full lg:h-full">
            <Image
              src="/landing/pup-main-building.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-[58%_50%]"
            />
            <div className="landing-hero-scrim absolute inset-0" />
          </div>
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 pt-12 pb-28 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:pt-16 lg:pb-36">
            <div className="hero-build">
              <Eyebrow className="hero-eyebrow text-gold-300">PUP Graduate School · Computer Engineering</Eyebrow>
              <TechTitle
                id="hero-title"
                onDark
                className="mt-5 text-[clamp(2.6rem,5.6vw,4.25rem)] leading-[1.04] font-semibold tracking-[-0.025em] text-white"
              />
              <p className="hero-copy mt-6 max-w-[46ch] text-lg leading-relaxed text-white/90">
                ThesIsko is one shared thesis workflow for the PUP Graduate School, Department of Computer Engineering
                (MSCpE and D.Eng with CpE specialization).
              </p>
              <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
                <SignInButton build />
                <p className="hero-note text-sm text-white/80">Your program coordinator sets up your account.</p>
              </div>
            </div>
            <div className="landing-rise relative">
              <aside className="absolute -top-8 right-2 z-10 hidden w-52 rounded-xl bg-gold-100 p-4 shadow-[0_14px_28px_-14px_rgb(122_92_0/0.55)] sm:block lg:-right-4">
                <p className="flex gap-2.5 text-sm leading-snug font-semibold text-maroon-900">
                  <Sparkles aria-hidden="true" strokeWidth={1.5} className="mt-0.5 size-4 shrink-0 text-gold-600" />
                  <span>
                    One status.
                    <br />
                    One version.
                    <br />
                    One next action.
                  </span>
                </p>
              </aside>
              <figure>
                <DashboardMockup />
                <figcaption className="sr-only">Illustrative student dashboard with sample content.</figcaption>
              </figure>
            </div>
          </div>
          <svg
            aria-hidden="true"
            viewBox="0 0 1440 90"
            preserveAspectRatio="none"
            className="absolute inset-x-0 bottom-0 h-16 w-full fill-white sm:h-20"
          >
            <path d="M0 60 C 240 10, 480 0, 720 30 S 1200 90, 1440 40 L 1440 90 L 0 90 Z" />
          </svg>
        </section>

        {/* The thesis journey */}
        <section id="journey" aria-labelledby="journey-title" className="scroll-mt-6">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] lg:items-center lg:py-24">
            <div className="landing-reveal">
              <Eyebrow className="text-gold-600">One track. All the steps.</Eyebrow>
              <h2 id="journey-title" className="mt-4 text-[clamp(2rem,3.6vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
                The Thesis Journey
              </h2>
              <p className="mt-5 max-w-[40ch] text-lg leading-relaxed text-neutral-700">
                From the Proposal Defense to clearance, every milestone is connected, visible and easy to track, in one
                place.
              </p>
              <a
                href="#versions"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-maroon-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-maroon-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400"
              >
                See how versions work
                <ArrowDown aria-hidden="true" strokeWidth={2} className="size-4" />
              </a>
            </div>
            <figure className="landing-reveal-late landing-window landing-grid rounded-3xl bg-white px-5 py-8 sm:px-8">
              <figcaption className="sr-only">Sample thesis journey: four milestones and the steps inside each.</figcaption>
              <ol className="landing-stagger grid grid-cols-2 gap-y-8 sm:grid-cols-4">
                {MILESTONES.map((m, i) => (
                  <li key={m.name} className="relative flex flex-col items-center text-center" style={{ "--i": i } as CSSProperties}>
                    {i < MILESTONES.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className="absolute top-7 left-[calc(50%+2.25rem)] hidden h-0.5 w-[calc(100%-4.5rem)] bg-neutral-200 sm:block"
                      />
                    ) : null}
                    <span aria-hidden="true" className={cn("flex size-14 items-center justify-center rounded-full", m.disc)}>
                      <m.icon strokeWidth={1.5} className="size-6" />
                    </span>
                    <span className="mt-3 text-[15px] leading-tight font-semibold text-neutral-900">{m.name}</span>
                    <span className={cn("mt-2 rounded-full px-2.5 py-0.5 text-xs font-medium", m.badge)}>{m.status}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-10 border-t border-dashed border-neutral-300 pt-6">
                <ul className="landing-stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {STEPS.map((s, i) => (
                    <li
                      key={s.label}
                      style={{ "--i": i } as CSSProperties}
                      className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 shadow-[0_0_0_1px_rgb(30_22_23/0.07),0_4px_10px_-6px_rgb(30_22_23/0.2)]"
                    >
                      <s.icon aria-hidden="true" strokeWidth={1.5} className="size-5 shrink-0 text-neutral-700" />
                      <span className="text-[13px] leading-tight text-neutral-700">{s.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </figure>
          </div>
        </section>

        {/* Built for everyone involved */}
        <section id="roles" aria-labelledby="roles-title" className="landing-roles-bg scroll-mt-6">
          <div aria-hidden="true" className="landing-roles-shape" />
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-8 lg:py-20">
            <div className="landing-reveal">
              <Eyebrow>Different roles. One system.</Eyebrow>
              <h2 id="roles-title" className="mt-4 text-[clamp(2rem,3.6vw,2.75rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
                Built for Everyone Involved
              </h2>
              <p className="mt-4 max-w-[52ch] text-lg leading-relaxed text-neutral-700">
                Each role has a clear view and purpose. ThesIsko keeps everyone aligned, informed and moving forward.
              </p>
            </div>
            <div className="landing-reveal-late">
              <RoleSwitcher />
            </div>
          </div>
        </section>

        {/* Versioned work */}
        <section id="versions" aria-labelledby="versions-title" className="scroll-mt-6 px-4 py-16 sm:px-8 lg:py-20">
          <div className="landing-reveal landing-panel mx-auto grid w-full max-w-6xl gap-12 rounded-[2rem] px-6 py-14 shadow-[0_0_0_1px_rgb(30_22_23/0.05)] sm:px-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
            <div>
              <Eyebrow>Versioned work. Real feedback.</Eyebrow>
              <h2 id="versions-title" className="mt-4 text-[clamp(2rem,3.4vw,2.6rem)] leading-[1.1] font-semibold tracking-[-0.02em]">
                <span className="block">More Than a Folder.</span>{" "}
                <span className="block">
                  It’s a <span className="text-maroon-600">Versioned Journey.</span>
                </span>
              </h2>
              <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-neutral-700">
                Every upload is a new version. Feedback stays pinned to the version it was written on. Comments don’t
                get lost between revisions, and everyone can see what changed.
              </p>
            </div>
            <figure className="landing-reveal-late">
              <VersionsMockup />
              <figcaption className="mt-4 text-xs text-neutral-500">Illustrative screens with sample content.</figcaption>
            </figure>
            <FeatureCards className="lg:col-span-2" />
          </div>
        </section>

        {/* The result */}
        <section aria-labelledby="result-title" className="relative mt-8 overflow-hidden">
          <Image
            src="/landing/pup-campus-skyline.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(90deg,rgb(30_22_23/0.85),rgb(30_22_23/0.35))]"
          />
          <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:items-center lg:py-24">
            <div className="landing-reveal">
              <Eyebrow className="text-gold-300">The result</Eyebrow>
              <h2 id="result-title" className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-white">
                No more{" "}
                <span className="font-[family-name:var(--font-landing-serif)] font-semibold text-gold-300 italic">
                  “Where is my thesis?”
                </span>
              </h2>
              <p className="mt-4 text-lg text-white/85">One status. One version. One next action.</p>
              <SignInButton className="mt-9" />
            </div>
            <ul className="landing-reveal-late landing-glass landing-stagger-blur space-y-4 rounded-2xl p-7">
              {GIVES.map((line, i) => (
                <li key={line} className="flex items-center gap-3 text-[15px] text-white" style={{ "--i": i + 1 } as CSSProperties}>
                  <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-400 text-maroon-900">
                    <CircleCheck strokeWidth={2} className="size-4" />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      {/* The bottom of the screen blurs, so content below the fold comes up out of focus and
          sharpens as it rises; the blur fades out at the end of the page (React Bits GradualBlur). */}
      <GradualBlur target="page" position="bottom" height="7rem" strength={2} layers={6} curve="bezier" autoHide zIndex={40} />
      {/* Footer */}
      <footer className="bg-neutral-900 text-white/75">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.2fr_1.6fr_1.2fr] md:items-center">
          <div>
            <Wordmark onDark className="text-[1.65rem] leading-none" />
            <p className="mt-3 max-w-[24ch] text-sm leading-relaxed">Because your thesis deserves a clear path.</p>
          </div>
          <nav aria-label="Footer" className="md:border-x md:border-white/15 md:px-10">
            <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="rounded transition-colors duration-150 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-400">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-sm leading-relaxed">
            PUP Graduate School
            <br />
            Department of Computer Engineering
          </p>
        </div>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 border-t border-white/10 px-4 py-6 text-xs text-white/60 sm:flex-row sm:justify-between sm:px-8">
          <p>© 2026 ThesIsko</p>
          <p>
            Campus photos:{" "}
            <a
              href="https://commons.wikimedia.org/wiki/File:PUP_Mabini_Campus_back_drone_(Santa_Mesa,_Manila;_01-05-2026).jpg"
              className="underline underline-offset-2 hover:text-white"
            >
              aerial
            </a>{" "}
            (cropped)
            and{" "}
            <a
              href="https://commons.wikimedia.org/wiki/File:PUP_Mabini_Campus,_NLEX_Connector,_Teresa_drone_(Santa_Mesa,_Manila;_01-05-2026).jpg"
              className="underline underline-offset-2 hover:text-white"
            >
              skyline
            </a>{" "}
            by Patrick Roque,{" "}
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" className="underline underline-offset-2 hover:text-white">
              CC BY-SA 4.0
            </a>
            , via Wikimedia Commons
          </p>
          <p lang="fil">Iskolar ng Bayan</p>
        </div>
      </footer>
    </div>
  );
}
