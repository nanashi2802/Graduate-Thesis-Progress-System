// /lab/screens/PROCESS (Task R4.3): the real PROCESS view (src/app/student/process/view.tsx) with mock props.
// Query: ?degree=doctoral, ?at=1|2|3|4|cleared (the current step), ?forms=a|b|c (decision R4-b), ?phone=current (R4-d B).
// The live route /student/process comes at R4.6, after gate UX-P-04. The form links do not open a file in /lab.
import { Suspense } from "react";
import { PageLoadingBlocks } from "@/components/patterns/loading";
import { processPosition, type DegreeLevel } from "@/app/student/process/steps";
import { ProcessView } from "@/app/student/process/view";
import type { MilestoneCode, MilestoneStatus } from "@/server/domain/milestone";
import { Demo, LabHeader, OptionGroups, ThemeStack, flat } from "../../_mock/panels";

const AT: Record<string, [MilestoneCode, MilestoneStatus]> = {
  "1": ["proposal", "DRAFT"],
  "2": ["pre_final", "READY"],
  "3": ["final", "DEFENSE_SCHEDULED"],
  "4": ["final", "FINAL_APPROVED"],
  cleared: ["final", "CLEARED"],
};

// R4-b: A a static file (public/forms), B a Student-only route, C no download yet.
const HREF: Record<string, ((code: string) => string) | undefined> = {
  a: (code) => `/forms/${code.replace("_", "-")}.doc`,
  b: (code) => `/student/forms/${code}`,
  c: undefined,
};

export default function Page(props: PageProps<"/lab/screens/PROCESS">) {
  return (
    <Suspense>
      <Variant {...props} />
    </Suspense>
  );
}

async function Variant({ searchParams }: PageProps<"/lab/screens/PROCESS">) {
  const q = flat(await searchParams);
  const degree: DegreeLevel = q.degree === "doctoral" ? "doctoral" : "masters";
  const at = q.at && AT[q.at] ? q.at : "2";
  const forms = q.forms === "b" || q.forms === "c" ? q.forms : "a";
  const phone = q.phone === "current" ? "current" : "accordion";
  const [code, status] = AT[at]!;
  const query = (patch: Record<string, string | undefined>) => {
    const next = { degree: degree === "masters" ? undefined : degree, at: at === "2" ? undefined : at, forms: forms === "a" ? undefined : forms, phone: phone === "accordion" ? undefined : phone, ...patch };
    const s = Object.entries(next)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    return s ? `?${s}` : "";
  };
  return (
    <>
      <LabHeader
        title="PROCESS · Thesis process (R4.3)"
        round="R4 · UX-P-04"
        states={["Master's (2 Panel Members)", "Doctoral (3 Panel Members)", "first day", "each current step", "cleared", "forms per R4-b", "phone per R4-d", "loading"]}
      />
      <OptionGroups
        base="/lab/screens/PROCESS"
        groups={[
          {
            label: "Degree level",
            links: [
              { label: "Master's", query: query({ degree: undefined }), current: degree === "masters" },
              { label: "Doctoral", query: query({ degree: "doctoral" }), current: degree === "doctoral" },
            ],
          },
          {
            label: "Current step",
            links: [
              { label: "1 Proposal (first day)", query: query({ at: "1" }), current: at === "1" },
              { label: "2 Pre-Final", query: query({ at: undefined }), current: at === "2" },
              { label: "3 Final", query: query({ at: "3" }), current: at === "3" },
              { label: "4 Clearance", query: query({ at: "4" }), current: at === "4" },
              { label: "Cleared", query: query({ at: "cleared" }), current: at === "cleared" },
            ],
          },
          {
            label: "R4-b Download form",
            note: "A and B show the same link. Only the address differs. In /lab no file opens.",
            links: [
              { label: "A: static file", query: query({ forms: undefined }), current: forms === "a", recommended: true },
              { label: "B: Student-only route", query: query({ forms: "b" }), current: forms === "b" },
              { label: "C: no download yet", query: query({ forms: "c" }), current: forms === "c" },
            ],
          },
          {
            label: "R4-d on a phone",
            note: "Below 640 px only.",
            links: [
              { label: "A: the same accordion", query: query({ phone: undefined }), current: phone === "accordion", recommended: true },
              { label: "B: the current step only", query: query({ phone: "current" }), current: phone === "current" },
            ],
          },
        ]}
      />
      <ThemeStack>
        <div className="mx-auto w-full max-w-[960px]">
          <ProcessView degreeLevel={degree} position={processPosition(code, status)} formHref={HREF[forms]} phone={phone} />
        </div>
      </ThemeStack>
      <div className="mt-6">
        <ThemeStack>
          <Demo title="Loading: the PROCESS page preset (R4.4)">
            <div className="w-full max-w-[960px]">
              <PageLoadingBlocks kind="process" label="Loading the thesis process" />
            </div>
          </Demo>
        </ThemeStack>
      </div>
    </>
  );
}
