// /lab/patterns/pdf-viewer (Task R5.5): the moved viewer with a fake 12-page PDF made in the browser (no storage call),
// the locked banner, the Round H error state (UX-009) and the "Opening the PDF…" line (UX-040). Query: ?page=n.
import { Suspense } from "react";
import { Demo, LabHeader, ThemeStack, flat } from "../../_mock/panels";
import { LabPdf, PdfErrorDemo } from "../../_mock/r5-demos";
import { LOCKED_TEXT } from "../../_mock/r5-data";

export default function Page(props: PageProps<"/lab/patterns/pdf-viewer">) {
  return (
    <Suspense>
      <Variant {...props} />
    </Suspense>
  );
}

async function Variant({ searchParams }: PageProps<"/lab/patterns/pdf-viewer">) {
  const q = flat(await searchParams);
  const page = q.page && /^\d{1,4}$/.test(q.page) ? Number(q.page) : undefined;
  return (
    <>
      <LabHeader title="PDF viewer (R5.5)" round="R5 · UX-P-05" states={["a fake 12-page PDF", "Page Up, Page Down, Home, End on the focused page", "?page=14 clamps to the last page", "the page stays white in dark (UX-D-01)", "locked banner (BR-07)", "load error with Try again (UX-009)", "the next step after a failed retry, by role (approved)","no Page 1 of 0 (UX-040)"]} />
      <ThemeStack>
        <Demo title="A fake 12-page PDF. Focus the page, then press Page Down. The page stays white in dark (UX-D-01).">
          <div className="w-full max-w-[720px]">
            <LabPdf page={page} />
          </div>
        </Demo>
        <Demo title="Locked after Gate 1b: the banner across the top (DESIGN.md §8.6)">
          <div className="w-full max-w-[720px]">
            <LabPdf locked={LOCKED_TEXT} />
          </div>
        </Demo>
        <Demo title="The file does not load (Student). Click Try again: the retry fails too, and the next step appears (approved, live at R5.9).">
          <div className="w-full max-w-[720px]">
            <LabPdf mode="error" nextFor="student" />
          </div>
        </Demo>
        <Demo title="Approved at UX-P-05 (live at R5.9): the error box before a retry (today's text), and after a failed retry for each role">
          <div className="grid w-full max-w-[960px] gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <p className="font-mono text-xs text-muted-foreground">Before a retry (today)</p>
              <PdfErrorDemo retried={false} />
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-mono text-xs text-muted-foreground">After: Student</p>
              <PdfErrorDemo role="student" retried />
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-mono text-xs text-muted-foreground">After: Adviser or Panel Member</p>
              <PdfErrorDemo role="adviser" retried />
            </div>
          </div>
        </Demo>
      </ThemeStack>
    </>
  );
}
