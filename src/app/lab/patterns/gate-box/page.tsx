// /lab/patterns/gate-box (Task R5.2): the A2 and P2 gate box, Return inline (R5-c A). Query: ?error=1 (the gate error
// stays in the dialog). The gate button opens the existing ConfirmDialog copy; the mock action changes nothing.
import { Suspense } from "react";
// The copy module is plain data; the dialog module is a client module, so a server page cannot call through it.
import { confirmCopy, GATE1B_LABEL } from "@/components/patterns/dialog/copy";
import { Demo, LabHeader, OptionGroups, ThemeStack, flat } from "../../_mock/panels";
import { GateBoxDemo } from "../../_mock/r5-demos";
import { GATE1A_CHECKS, GATE1B_CHECKS } from "../../_mock/r5-data";

export default function Page(props: PageProps<"/lab/patterns/gate-box">) {
  return (
    <Suspense>
      <Variant {...props} />
    </Suspense>
  );
}

async function Variant({ searchParams }: PageProps<"/lab/patterns/gate-box">) {
  const q = flat(await searchParams);
  const gateError = q.error === "1";
  const base = "/lab/patterns/gate-box";
  return (
    <>
      <LabHeader title="Gate box (R5.2)" round="R5 · UX-P-05" states={["waiting (no Ready commit)", "one check fails (button blocked with that reason)", "two checks fail (the first reason)", "all checks pass (one maroon button, opens the dialog)", "Gate 1b last endorsement (Endorse and lock manuscript)", "Return inline (R5-c A)", "gate error in the dialog"]} />
      <OptionGroups
        base={base}
        groups={[
          {
            label: "Gate action result",
            links: [
              { label: "Saved", query: "", current: !gateError },
              { label: "Server error (stays in the dialog)", query: "?error=1", current: gateError },
            ],
          },
        ]}
      />
      <ThemeStack>
        <Demo title="A2, Gate 1a: no Ready commit. The gate button is blocked with the waiting sentence. No Return yet.">
          <div className="w-full max-w-[720px]">
            <GateBoxDemo checks={[]} gateLabel="Endorse (Gate 1a)" confirm={confirmCopy({ kind: "endorse1a" })} waiting="Waiting for the Student to mark a version Ready." withReturn={false} />
          </div>
        </Demo>
        <Demo title="A2, Gate 1a: one check fails. Return is never disabled (F3).">
          <div className="w-full max-w-[720px]">
            <GateBoxDemo checks={GATE1A_CHECKS(false)} gateLabel="Endorse (Gate 1a)" confirm={confirmCopy({ kind: "endorse1a" })} gateError={gateError} />
          </div>
        </Demo>
        <Demo title="A2, Gate 1a at Pre-Final: two checks fail. The button gives the first reason; each row gives its own.">
          <div className="w-full max-w-[720px]">
            <GateBoxDemo
              checks={[...GATE1A_CHECKS(false), { id: "ipmo", label: "The IPMO check passed", ok: false, reason: "The IPMO check has not passed." }]}
              gateLabel="Endorse (Gate 1a)"
              confirm={confirmCopy({ kind: "endorse1a" })}
             
              gateError={gateError}
            />
          </div>
        </Demo>
        <Demo title="A2, Gate 1a: all checks pass. The gate button is the one maroon button. It opens the dialog (focus on Cancel).">
          <div className="w-full max-w-[720px]">
            <GateBoxDemo checks={GATE1A_CHECKS(true)} gateLabel="Endorse (Gate 1a)" confirm={confirmCopy({ kind: "endorse1a" })} gateError={gateError} />
          </div>
        </Demo>
        <Demo title="P2, Gate 1b: the last endorsement. Every Gate 1b endorser sees Endorse and lock manuscript; the dialog body says the lock happens now (BR-07). No Return on P2 today.">
          <div className="w-full max-w-[720px]">
            <GateBoxDemo checks={GATE1B_CHECKS(true)} gateLabel={GATE1B_LABEL} confirm={confirmCopy({ kind: "endorse1b", locks: true })} withReturn={false} gateError={gateError} />
          </div>
        </Demo>
        <Demo title="P2, Gate 2 at Final: a clearance item is incomplete (SITEMAP §9)">
          <div className="w-full max-w-[720px]">
            <GateBoxDemo
              checks={[
                { id: "rpo", label: "The IPMO and RPO items are complete", ok: false, reason: "A clearance item is incomplete." },
                { id: "threads", label: "Your threads are resolved", ok: true },
              ]}
              gateLabel="Approve the final manuscript (Gate 2)"
              confirm={confirmCopy({ kind: "gate2" })}
              withReturn={false}
            />
          </div>
        </Demo>
      </ThemeStack>
    </>
  );
}

