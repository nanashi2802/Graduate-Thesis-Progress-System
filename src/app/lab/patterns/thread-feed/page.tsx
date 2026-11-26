// /lab/patterns/thread-feed (Task R5.4): the thread feed as the Student, the Adviser and a Panel Member see it.
// "p. 14" is a link (R5-d B). Query: ?tab=all|resolved, ?error=1 (a reply error), ?blocked=1 (the comment window is closed).
import { Suspense } from "react";
import { Demo, LabHeader, OptionGroups, ThemeStack, flat } from "../../_mock/panels";
import { ThreadFeedDemo } from "../../_mock/r5-demos";
import { threadsFor } from "../../_mock/r5-data";

export default function Page(props: PageProps<"/lab/patterns/thread-feed">) {
  return (
    <Suspense>
      <Variant {...props} />
    </Suspense>
  );
}

async function Variant({ searchParams }: PageProps<"/lab/patterns/thread-feed">) {
  const q = flat(await searchParams);
  const tab = q.tab === "all" || q.tab === "resolved" ? q.tab : "open";
  const replyError = q.error === "1";
  const blocked = q.blocked === "1";
  const base = "/lab/patterns/thread-feed";
  const qs = (patch: Record<string, string | undefined>) => {
    const next = { tab: tab === "open" ? undefined : tab, error: replyError ? "1" : undefined, blocked: blocked ? "1" : undefined, ...patch };
    const s = Object.entries(next).filter(([, v]) => v !== undefined).map(([k, v]) => `${k}=${v}`).join("&");
    return s ? `?${s}` : "";
  };
  return (
    <>
      <LabHeader
        title="Thread feed (R5.4)"
        round="R5 · UX-P-05"
        states={["tabs Open, All, Resolved with counts", "p. 14 as a link (R5-d B)", "Outdated (BR-06)", "Addressed by v4 (FR-REV-08)", "replies", "own open threads with the amber edge", "Resolve only for the author (BR-05)", "the Student: Reply only", "resolved threads on one line", "New thread with the optional Page", "comment window closed", "reply error", "empty"]}
      />
      <OptionGroups
        base={base}
        groups={[
          {
            label: "Start tab",
            links: [
              { label: "Open", query: qs({ tab: undefined }), current: tab === "open" },
              { label: "All", query: qs({ tab: "all" }), current: tab === "all" },
              { label: "Resolved", query: qs({ tab: "resolved" }), current: tab === "resolved" },
            ],
          },
          {
            label: "Results",
            links: [
              { label: "Reply saved", query: qs({ error: undefined }), current: !replyError },
              { label: "Reply error", query: qs({ error: "1" }), current: replyError },
              { label: "Comment window closed", query: qs({ blocked: blocked ? undefined : "1" }), current: blocked },
            ],
          },
        ]}
      />
      <ThemeStack>
        <div className="grid gap-8 xl:grid-cols-3">
          <Demo title="A2, the Adviser: own open threads have the amber edge; Resolve on own threads only">
            <div className="w-full max-w-[400px]">
              <ThreadFeedDemo threads={threadsFor("adviser")} viewerRole="adviser" withPost postOrdinal={4} postBlockedReason={blocked ? "The comment window is closed." : undefined} defaultTab={tab} replyError={replyError} />
            </div>
          </Demo>
          <Demo title="S2, the Student: Reply on every open thread, never Resolve (BR-05), no New thread">
            <div className="w-full max-w-[400px]">
              <ThreadFeedDemo threads={threadsFor("student")} viewerRole="student" defaultTab={tab} replyError={replyError} />
            </div>
          </Demo>
          <Demo title="P2, the Lead Panel Member: own thread with the amber edge">
            <div className="w-full max-w-[400px]">
              <ThreadFeedDemo threads={threadsFor("panel")} viewerRole="panel_member" withPost postOrdinal={4} postBlockedReason={blocked ? "The comment window is closed." : undefined} defaultTab={tab} replyError={replyError} />
            </div>
          </Demo>
        </div>
        <Demo title="Empty: no thread yet (A2 first day)">
          <div className="w-full max-w-[400px]">
            <ThreadFeedDemo threads={[]} viewerRole="adviser" withPost postBlockedReason="Upload a commit first." />
          </div>
        </Demo>
      </ThemeStack>
    </>
  );
}

