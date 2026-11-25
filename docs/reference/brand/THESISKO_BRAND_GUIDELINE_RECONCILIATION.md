# ThesIsko Brand Guideline Reconciliation

**Status:** Approved product-design decision  
**Decision:** Hybrid logo usage  
**Applies to:** ThesIsko UI/UX retrofit

## 1. Approved logo strategy

Retain the complete ThesIsko symbol and wordmark on public-facing brand surfaces. Use a compact brand treatment inside the working application.

| Application area | Approved treatment |
|---|---|
| Landing page | Complete symbol + wordmark |
| Login page | Complete symbol + wordmark |
| Student application | Symbol or text-only wordmark |
| Adviser application | Symbol or text-only wordmark |
| Panel Member application | Symbol or text-only wordmark |
| Coordinator application | Symbol or text-only wordmark |
| Compact navigation | Symbol only, where appropriate |

Implementation rules:

- Preserve the approved logo artwork and proportions.
- Do not stretch, distort, or create unofficial logo variants.
- Do not recolor the logo outside permitted brand usage.
- Choose symbol or text-only treatment in the application shell based on available space and legibility.
- Keep navigation visually lightweight.
- Maintain recognizable ThesIsko identity across all roles.
- A compact application treatment must not alter the official logo artwork.

## 2. How the brand guide and retrofit decisions work together

Keep the existing brand-guidelines document. Do not rewrite or replace it as part of this retrofit.

### Mandatory brand constraints

Follow the existing guide for approved brand assets and identity rules, including:

- Brand name and identity.
- Approved color palette and color values.
- Logo artwork, proportions, and permitted usage.
- Typography families and their intended roles, where specified.
- Mascot artwork and restrictions, where applicable.

If a brand rule is unclear or conflicts with an approved product requirement, document the conflict and ask for a decision. Do not silently alter brand assets.

### Product-design principles

Apply the approved retrofit direction to the actual application experience:

- Usability first.
- Linear-inspired navigation, workflow clarity, and information hierarchy.
- Notion-inspired reading, manuscript, and content organization.
- Stripe-inspired forms, validation, dialogs, and interaction quality.
- Balanced and adaptive information density.
- Desktop-first layouts optimized for desktop, laptop, and tablet.
- Light and dark themes, with system preference by default and a manual toggle in the shared header or sidebar.
- Comprehensive accessibility.
- Professional by default, with expressive elements reserved for meaningful moments.
- Preserve existing screens, routes, user flows, backend contracts, and permissions.

### Flexible visual implementation guidance

Treat exact layout dimensions, spacing applications, decorative patterns, shadows, card treatments, and animation choices as context-sensitive implementation decisions.

- Treat color-proportion guidance as a visual reference, not a forced numerical ratio on every application screen.
- Use the existing spacing scale as a foundation, but adapt spacing to content and task.
- Use page curves, book motifs, gradients, and other decorative treatments selectively.
- Use the mascot purposefully for onboarding, empty states, optional guidance, or positive milestones. It must not replace important status text, compete with primary actions, or trivialize errors and serious academic outcomes.
- Do not add decorative animation that delays or distracts from work.

## 3. Source-document relationship

The existing brand guide remains the source for brand identity. The retrofit documents record how that identity is applied to the existing product.

- `design.md` — existing brand and visual guidance; preserve and reference it.
- `SITEMAP.md` — existing screens, routes, and navigation; preserve it.
- `USERFLOW.md` — existing user journeys and workflow behavior; preserve it.
- `docs/ui-ux-audit/DESIGN_DECISIONS.md` — approved product UI/UX decisions, including the hybrid logo strategy.
- `docs/ui-ux-audit/UI_UX_AUDIT.md` — evidence-based findings against the actual application.
- `docs/ui-ux-audit/IMPLEMENTATION_PLAN.md` — approved and pending implementation work.

Do not duplicate the brand guide in the audit folder. Reference the exact source file and section when recording a finding or decision.

## 4. Required audit action

During the audit, compare the existing application against:

1. The brand identity requirements in the existing brand guide.
2. The approved product-design decisions in the UI/UX retrofit plan.

Record:

- Brand-guide requirements already satisfied.
- Brand-guide requirements not yet applied consistently.
- Product-design decisions that refine how the brand is applied in the application.
- Genuine conflicts that need user input.

Do not treat a difference between a public landing page and the authenticated application shell as a brand violation when it follows the approved hybrid logo strategy.

Do not implement visual changes during the audit. Build previews first and obtain explicit approval before integration.
