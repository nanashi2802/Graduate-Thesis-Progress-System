// /lab/patterns/task-list (Task R4.1): the task list as S3, S1, S6 and C7 will use it, every document state, the
// collapsed groups (decision R4-a), the empty group and the loading shape (R4.4). Query: ?disclosure=details (R4-a A).
import { Suspense } from "react";
import { LoadingBlocks } from "@/components/patterns/loading";
import { TaskList } from "@/components/patterns/task-list";
import { Demo, LabHeader, OptionGroups, ThemeStack, flat } from "../../_mock/panels";
import { C7_GROUPS, S1_GROUPS, S6_GROUPS, s3Groups } from "../../_mock/r4-demos";

export default function Page(props: PageProps<"/lab/patterns/task-list">) {
  return (
    <Suspense>
      <Variant {...props} />
    </Suspense>
  );
}

async function Variant({ searchParams }: PageProps<"/lab/patterns/task-list">) {
  const q = flat(await searchParams);
  const disclosure = q.disclosure === "details" ? "details" : "button";
  const base = "/lab/patterns/task-list";
  return (
    <>
      <LabHeader
        title="Task list (R4.1)"
        round="R4 · UX-P-04"
        states={["not started", "scan uploaded", "locked", "verified", "returned with the reason word for word", "long reason (2 lines, Show more)", "blocked action with its reason", "read-only rows", "outside chips", "collapsed groups", "empty group", "loading"]}
      />
      <OptionGroups
        base={base}
        groups={[
          {
            label: "R4-a collapsed group",
            links: [
              { label: "A: native <details>", query: "?disclosure=details", current: disclosure === "details" },
              { label: "B: disclosure button", query: "", current: disclosure === "button", recommended: true },
            ],
          },
        ]}
      />
      <ThemeStack>
        <Demo title="S3 Documents, working: Returned (the Coordinator's reason, word for word), Locked (Upload blocked with its reason), Verified, Scan uploaded, read-only rows. Open the two collapsed groups.">
          <div className="w-full max-w-[960px]">
            <TaskList groups={s3Groups("working")} disclosure={disclosure} />
          </div>
        </Demo>
        <Demo title="S3 Documents, first day: every row Not started, with Download form from day one">
          <div className="w-full max-w-[960px]">
            <TaskList groups={s3Groups("first-day")} disclosure={disclosure} />
          </div>
        </Demo>
        <Demo title="S1 This milestone: each item with its state, and its reason if it blocks">
          <div className="w-full max-w-[960px]">
            <TaskList groups={S1_GROUPS} disclosure={disclosure} />
          </div>
        </Demo>
        <Demo title="S6 Clearance items: outside chips (dashed), document stamps, evidence uploads">
          <div className="w-full max-w-[960px]">
            <TaskList groups={S6_GROUPS} disclosure={disclosure} />
          </div>
        </Demo>
        <Demo title="C7 items of one Student: Verify and Return row actions (equal widths). The maroon action is the Docket's Record cleared.">
          <div className="w-full max-w-[960px]">
            <TaskList groups={C7_GROUPS} disclosure={disclosure} />
          </div>
        </Demo>
        <Demo title="Loading: the task list shape (R4.4)">
          <div className="w-full max-w-[960px]">
            <LoadingBlocks shape="tasks" rows={4} label="Loading the documents" />
          </div>
        </Demo>
      </ThemeStack>
    </>
  );
}
