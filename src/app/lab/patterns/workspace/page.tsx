// /lab/patterns/workspace (Task R5.6, R5.8): the whole manuscript workspace for S2, A2 and P2 with mock data.
// The UX-P-05 choices: Threads tab below 1024 px (R5-a A), the upload at the foot of the Manuscript column, not sticky
// (R5-b A adapted), Return inline (R5-c A), "p. 14" as a link (R5-d B).
// Query: ?role=student|adviser|panel, ?state=first-day|working|ready|locked, ?identity=proposed (needs a data change:
// see the note), ?gate=pass, ?pdf=error, ?commit=n, ?page=n. Each option keeps the others.
import { Suspense } from "react";
import { LoadingBlocks, PageLoadingBlocks } from "@/components/patterns/loading";
import { Demo, LabHeader, OptionGroups, ThemeStack, flat } from "../../_mock/panels";
import { WorkspaceDemo, type WorkspaceDemoProps } from "../../_mock/r5-demos";
import { LAB_ROLES, LAB_STATES, type LabRole, type LabState } from "../../_mock/r5-data";

export default function Page(props: PageProps<"/lab/patterns/workspace">) {
  return (
    <Suspense>
      <Variant {...props} />
    </Suspense>
  );
}

const ROLE_LABEL: Record<LabRole, string> = { student: "S2 Student", adviser: "A2 Adviser", panel: "P2 Panel Member" };
const STATE_LABEL: Record<LabState, string> = { "first-day": "First day", working: "Working", ready: "Ready", locked: "Locked (after Gate 1b)" };

async function Variant({ searchParams }: PageProps<"/lab/patterns/workspace">) {
  const q = flat(await searchParams);
  const role: LabRole = LAB_ROLES.includes(q.role as LabRole) ? (q.role as LabRole) : "student";
  const state: LabState = LAB_STATES.includes(q.state as LabState) ? (q.state as LabState) : "working";
  const opts = {
    identity: q.identity === "proposed" ? "proposed" : undefined,
    gate: q.gate === "pass" ? "pass" : undefined,
    pdf: q.pdf === "error" ? "error" : undefined,
  };
  const page = q.page && /^\d{1,4}$/.test(q.page) ? Number(q.page) : undefined;
  const commit = q.commit && /^\d{1,4}$/.test(q.commit) ? Number(q.commit) : undefined;
  const path = "/lab/patterns/workspace";
  const qs = (patch: Record<string, string | undefined>) => {
    const next: Record<string, string | undefined> = { role: role === "student" ? undefined : role, state: state === "working" ? undefined : state, ...opts, ...patch };
    const s = Object.entries(next).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${v}`).join("&");
    return s ? `?${s}` : "";
  };
  const props: WorkspaceDemoProps = {
    role,
    state,
    base: `${path}${qs({})}`,
    commit,
    page,
    identity: opts.identity === "proposed" ? "proposed" : "today",
    gatePass: opts.gate === "pass",
    pdf: opts.pdf === "error" ? "error" : "file",
  };
  return (
    <>
      <LabHeader
        title="Manuscript workspace (R5.6, R5.8)"
        round="R5 · UX-P-05"
        states={["S2, A2, P2", "first day, working, Ready, locked", "split view at laptop, Threads tab below 1024 px", "upload at the foot of the Manuscript column (not sticky)", "Return inline", "p. 14 as a link", "identity line gap", "PDF error", "loading"]}
      />
      <OptionGroups
        base={path}
        groups={[
          { label: "Screen", links: LAB_ROLES.map((r) => ({ label: ROLE_LABEL[r], query: qs({ role: r === "student" ? undefined : r }), current: role === r })) },
          { label: "State", links: LAB_STATES.map((s) => ({ label: STATE_LABEL[s], query: qs({ state: s === "working" ? undefined : s }), current: state === s })) },
          {
            label: "Identity line (gap)",
            note: "Proposed needs the thesis title and the Student name in workspaceFor: a read-only data change for your approval. Mock text only.",
            links: [
              { label: "Today's data", query: qs({ identity: undefined }), current: !opts.identity },
              { label: "Proposed (mock)", query: qs({ identity: "proposed" }), current: opts.identity === "proposed" },
            ],
          },
          {
            label: "Data",
            links: [
              { label: "Gate checks fail", query: qs({ gate: undefined }), current: !opts.gate },
              { label: "Gate checks pass", query: qs({ gate: "pass" }), current: opts.gate === "pass" },
              { label: "PDF loads", query: qs({ pdf: undefined }), current: !opts.pdf },
              { label: "PDF error", query: qs({ pdf: "error" }), current: opts.pdf === "error" },
            ],
          },
        ]}
      />
      <ThemeStack>
        <WorkspaceDemo {...props} />
      </ThemeStack>
      <div className="mt-6">
        <ThemeStack>
          <Demo title="Loading: the workspace shape and page preset (R5.7)">
            <div className="flex w-full flex-col gap-8">
              <LoadingBlocks shape="workspace" label="Loading the manuscript" />
              <PageLoadingBlocks kind="workspace" label="Loading the manuscript" />
            </div>
          </Demo>
        </ThemeStack>
      </div>
    </>
  );
}

