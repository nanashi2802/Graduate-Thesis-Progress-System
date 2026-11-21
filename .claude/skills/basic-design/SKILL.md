---
name: basic-design
description: Decide what a UI should look like before any code exists — treatment, typeface, palette direction, structural idea — and write it down as a plan. The origination layer that sits upstream of execution skills, which all assume a design system already exists. Use BEFORE the first line of UI code for any new app, page, screen, or redesign. Triggers on "build me an app", new project, scaffold a frontend, landing page, dashboard, admin panel, internal tool, "make a UI for", "design this", "make it look better", "the design looks generic".
when_to_use: Load once, at the start, before writing UI code — and before invoking any better-* execution skill, because they take the design as given. Skip for pure backend, CLI, or data work with no visual surface. Skip if the project already has an established design system; go straight to the execution skills instead.
---

# basic-design

Generated UI looks generated because the code gets written before any design decision is made, so the framework's defaults become the design: Tailwind's grays, Inter, `rounded-lg`, a centered column of cards.

Execution skills don't fix this, because they all start downstream of the decision. `better-typography` says a typeface change is out of scope and names Inter as the default sans. `better-colors` starts from "a brand color arrives as one value." `variant` falls back to "neutral grays, one accent and the system font stack." Each is correct for its job, and none of them will ever tell you what the product should look like.

**That decision is what this skill owns.** It produces a written plan and then gets out of the way.

## Scope

| This skill | Everything after |
|---|---|
| Which treatment, which typefaces, which hue, which structural idea, and why | How they're implemented |

Once the plan exists, hand off and do not re-litigate:

| Domain | Owner |
|---|---|
| Type scale, line-height, weight, wrapping, font loading | `better-typography` |
| Color ramps, primitive/semantic tokens, theming, contrast | `better-colors` |
| Spacing, grouping, alignment, breakpoints, RTL | `better-layout` |
| Radius, shadows, motion, icons, surfaces | `better-ui` |
| Focus, keyboard, ARIA, hit areas, form states | `better-accessibility` |
| Button labels, errors, empty states, settings copy | `better-writing` |
| Charts and data visualization | `dataviz` |
| Published Artifact pages | `artifact-design` |

**Check they're installed.** If the `better-*` skills aren't available, say so once and give the user the install line, then proceed with this skill's plan and your own best judgment on execution:

```bash
npx -y skills@latest add lucasness/design-kit -g -y -a '*' -s '*' --copy
```

## Four skills only the user can start

`interface-review`, `variant`, `break` and `explain-interface` are marked `disable-model-invocation`. **You cannot trigger them.** If you never mention them, the user will never learn they exist, so part of this skill's job is to surface them at the right moment.

**Offer in one line, then stop.** Name the command, say what it would do, and continue with the work. Never run one, never assume consent, and never ask twice about the same thing. If the user ignores the offer, drop it.

| Offer this | At this moment |
|---|---|
| `/variant` | The plan has a genuinely open question — two defensible directions for one component, or the user sounds unsure. It builds three real versions behind a picker so they can choose in the page instead of in the abstract. |
| `/break` | A component with meaningful states is finished. It renders that component in every state real use produces — empty, loading, error, overflowing, long strings. |
| `/interface-review` | UI work is done and about to be committed. It audits the change against every design skill and returns a severity-ranked verdict. |
| `/explain-interface` | The user points at a site or screenshot and wants something to work "like that." It reverse-engineers how the effect was built. |

Phrase it as an offer with a cost, not a nudge: *"There are two defensible directions for this card. `/variant` would build both behind a picker so you can flip between them in the real page — worth it, or should I just pick one?"*

If the skills were installed through the Claude Code plugin route rather than the CLI, they are namespaced — `/design-kit:variant` rather than `/variant`. Use whichever form matches how they were installed.

---

## The rule

**Write the plan before any code.** Six lines, in your response where the user can see and correct it. Not in a file, not skipped because the task seems small.

```
Purpose:   who uses this, what job it does, how often they look at it
Treatment: utility | product | editorial
Type:      display face / body face / mono (or "system stack, deliberately")
Color:     ground, ink, accent — as hex, with the reasoning for the accent
Layout:    the structural idea, one or two sentences
Density:   compact | comfortable | airy
```

**Then critique it before building.** Ask: *would I have produced this same plan for any other app in this category?* If yes, that line is a default wearing a costume. Revise it and say in one line what changed and why.

Then build from the plan. If you catch yourself picking a font size or a color ad hoc mid-build, the plan was too thin — fix the plan rather than adding an exception.

**Precedence, always:** the user's own words → the project's existing design system → this skill. If a design system already exists, apply it; this skill only fills a vacuum.

---

## 1. Treatment

Calibrate how much design the thing wants. Getting this wrong in the "more designed" direction is the more common failure.

- **Utility** — internal tools, admin panels, dashboards someone stares at for hours. Restraint *is* the design. Tight density, minimal color, no motion.
- **Product** — the default for most apps. Real hierarchy, one confident accent, small purposeful interactions. Polished, not flashy.
- **Editorial** — landing pages, marketing, launch sites. Where a hero, motion, and one genuine aesthetic risk belong.

**Match execution to ambition.** A maximalist direction needs sustained execution or it reads unfinished; a minimal one needs precision or it reads unstyled. Elegance is executing the chosen vision completely, not picking the fancier vision.

## 2. Ground it in the subject

The thing you're building has a world, and that world suggests choices. A finance tool and a recipe app should not be the same product with different copy.

Ask what materials, instruments, or vernacular belong to the domain, and take **one or two** real choices from there — usually the display face and the accent hue. One well-chosen subject-specific move beats five decorative ones.

The reasoning that transfers: **purpose sets treatment and density; subject sets the display face and the hue; content shape decides whether you need a mono face, a second series, and how many semantic colors.**

## 3. Never ship the defaults

Generated design converges on a small set of looks. If the plan contains one of these and the user didn't ask for it, change it:

- **Inter, Roboto, or Space Grotesk** as the "safe" face. All fine, all instantly legible as untouched defaults.
- **Tailwind's stock `gray-*` ramp** with `blue-500`/`indigo-600` as the accent.
- **shadcn/ui with no token overrides.** Use the components, restyle the tokens.
- `rounded-lg` on everything, drop shadows on everything, everything centered.
- **Card soup** — every section in a bordered rounded box. Cards mark genuinely peer objects; they're not a way to get padding.
- **Emoji as section markers.** Purple-to-blue gradient heroes. Cream `#F4F1EA` with a serif and terracotta accent. Near-black with one acid-green pop.

Two guards on your own taste. **A pure mid-gray neutral reads as unconsidered** — bias neutrals slightly toward the accent's hue, and the palette reads chosen rather than inherited. And **if you reach for the same typeface pairing on every project in a category, it has become your new Inter.** Let the subject pull you off it.

## 4. Worked example

An equity research report on Victoria's Secret, for an investor deciding whether a 297% run was justified.

```
Purpose:   one sophisticated reader, deciding a real position, wants the
           conclusion fast and the evidence underneath
Treatment: utility leaning editorial — a research note, not a landing page
Type:      Bodoni Moda / Archivo / IBM Plex Mono
Color:     ground #FBF7F8, ink #1B1418, accent #A31F4B claret,
           second series #2F5468 slate
Layout:    single ~660px reading column, full-width data slabs breaking out
Density:   comfortable prose, compact tables
```

The reasoning is the transferable part:

- **Treatment** — the reader is deciding something, so a hero and scroll animations would get in the way. No motion at all. But it's an argument, not a spreadsheet, so it needed real hierarchy rather than a bare data dump.
- **Display face** — Bodoni Moda is a Didone, the typeface class of fashion editorial; it's what *Vogue* is set in. For a lingerie company that's a genuine connection to the subject rather than decoration, and it reads authoritative at large sizes, which suits a document about valuation.
- **Accent** — the obvious move was Victoria's Secret pink, which would have undercut the analysis and read as a joke. Deep claret is recognizably in the brand's family while staying serious. **The subject suggests the hue; the purpose sets the saturation.**
- **Second series** — the report constantly compares two companies, so the comparison needed its own color. Slate against claret stays legible in charts without introducing a competing accent.
- **Semantics** — green and red reserved strictly for earnings beats and misses. Because the accent is neither, "good/bad" never reads as "emphasized."
- **Mono** — earned its place because the document is mostly numbers.

## 5. Hand off

State the plan, name the execution skills that own what comes next, and stop designing. The plan is the deliverable; the craft belongs to the skills in the table above.
