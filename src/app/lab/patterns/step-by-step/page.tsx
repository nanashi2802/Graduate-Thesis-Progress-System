// /lab/patterns/step-by-step (Task R4.2): "You are here" on the current step, the other steps collapsed, done steps
// with the done glyph, "Show all steps", the phone choice (decision R4-d) and the loading shape (R4.4).
// Query: ?phone=current (R4-d B). The full screen is /lab/screens/PROCESS.
import { Suspense } from "react";
import { LoadingBlocks } from "@/components/patterns/loading";
import { StepByStep } from "@/components/patterns/step-by-step";
import { Demo, LabHeader, OptionGroups, ThemePanels, flat } from "../../_mock/panels";
import { demoSteps } from "../../_mock/r4-demos";

export default function Page(props: PageProps<"/lab/patterns/step-by-step">) {
  return (
    <Suspense>
      <Variant {...props} />
    </Suspense>
  );
}

async function Variant({ searchParams }: PageProps<"/lab/patterns/step-by-step">) {
  const q = flat(await searchParams);
  const phone = q.phone === "current" ? "current" : "accordion";
  return (
    <>
      <LabHeader
        title="Step-by-step (R4.2)"
        round="R4 · UX-P-04"
        states={["first day (step 1 current)", "step 2 current, step 1 done", "all steps done", "Show all steps", "phone (R4-d)", "loading"]}
      />
      <OptionGroups
        base="/lab/patterns/step-by-step"
        groups={[
          {
            label: "R4-d on a phone",
            note: "The choice changes the page below 640 px only. Use a phone viewport to see it.",
            links: [
              { label: "A: the same accordion", query: "", current: phone === "accordion", recommended: true },
              { label: "B: the current step, then Show all steps", query: "?phone=current", current: phone === "current" },
            ],
          },
        ]}
      />
      <div className="flex flex-col gap-6">
        <ThemePanels>
          <Demo title="Step 2 current, step 1 done">
            <StepByStep steps={demoSteps(2)} phone={phone} className="w-full" />
          </Demo>
        </ThemePanels>
        <ThemePanels>
          <Demo title="First day: step 1 current">
            <StepByStep steps={demoSteps(1)} phone={phone} className="w-full" />
          </Demo>
        </ThemePanels>
        <ThemePanels>
          <Demo title="Cleared: every step done, no current step">
            <StepByStep steps={demoSteps(null)} phone={phone} className="w-full" />
          </Demo>
        </ThemePanels>
        <ThemePanels>
          <Demo title="Loading: the steps shape (R4.4)">
            <LoadingBlocks shape="steps" rows={4} label="Loading the thesis process" className="w-full" />
          </Demo>
        </ThemePanels>
      </div>
    </>
  );
}
