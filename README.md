# SPPQ — PUP CpE Thesis Progress Monitoring System

Frontend-first workspace for the PUP Graduate Computer Engineering thesis progress prototype. The governing specifications and the Stitch Mode A reference are in this repo. Application code has not been started.

## Governing documents

Read these in order before changing the product:

1. `docs/governing/PUP CpE Thesis Progress System - Architectural Scratchpad.md` — glossary, ADR-001 through ADR-010, functional requirements, and the decision to defer the AI agents.
2. `docs/governing/PUP CpE Thesis Progress System - Operational Flow & Tech Stack Specification.md` — Stages 0–6, the consultation gap matrix, and the technology mapping.
3. `docs/governing/PUP CpE Thesis Progress System - SITEMAP & Frontend Specification.md` — routes, mock accounts, screen contracts, design tokens, and the Mode A acceptance checks.

When the documents overlap, the sitemap screen contracts and the later ADRs govern the prototype. Parked actions GAP-02 (defense schedule confirmation) and GAP-03 (physical evaluation encoding) stay inside the Program Coordinator portal.

## Design reference

Stitch project **Document Ingestion Processor**, screen **PUP CpE Thesis Progress Monitoring System - Unified Artifact (Mode A)**:

- `design/stitch/document-ingestion-processor/code.html` — single-file reference for the full multi-role prototype
- `design/stitch/document-ingestion-processor/screen.png` — exported view of the Program Coordinator portal
- `design/stitch/document-ingestion-processor/stitch_document_ingestion_processor.zip` — original export

The HTML is the visual and interaction reference. It is not the application source.

## Locked phase

ADR-007 keeps this phase frontend-only. Data lives in a deterministic mock store. UI slots for the AI Pre-Flight and Revision Synthesizer stay visible and inactive. The later application stack is Next.js (App Router), React, TypeScript, Tailwind CSS, and Lucide. Supabase, Inngest or Trigger.dev, Resend, and the embedded AI agents stay out of this phase.

## Not started

Frontend implementation and visual fine-tuning. That work begins only after this source set is the working baseline.
