// /lab/patterns/commit-selector (Task R5.3): the commit list of S2, A2, P2 and SV. Query: ?commit=n selects a commit.
import { Suspense } from "react";
import { CommitSelector, type CommitEntry } from "@/components/patterns/commit-selector";
import { Demo, LabHeader, ThemeStack, flat } from "../../_mock/panels";
import { commitsFor } from "../../_mock/r5-data";

export default function Page(props: PageProps<"/lab/patterns/commit-selector">) {
  return (
    <Suspense>
      <Variant {...props} />
    </Suspense>
  );
}

const MANY: CommitEntry[] = Array.from({ length: 8 }, (_, i) => ({
  id: `m${i + 1}`,
  ordinal: i + 1,
  sha256: `${(i + 1).toString(16)}a7c3e9f`.repeat(8).slice(0, 64),
  uploadedAt: new Date(Date.UTC(2027, 0, 2 + i * 3, 3 + i, 20)),
  uploader: "You",
  changeNote: i === 7 ? "Final formatting after the Pre-Final defense" : null,
}));

async function Variant({ searchParams }: PageProps<"/lab/patterns/commit-selector">) {
  const q = flat(await searchParams);
  const n = Number(q.commit);
  const four = commitsFor("student");
  const sel = four.find((c) => c.ordinal === n) ?? four.at(-1)!;
  const selMany = MANY.find((c) => c.ordinal === n) ?? MANY.at(-1)!;
  return (
    <>
      <LabHeader title="Commit selector (R5.3)" round="R5 · UX-P-05" states={["newest first", "Ready pill", "selected (aria-current)", "change note", "8 commits: 3 shown, 5 behind a disclosure button", "an older commit selected (the group opens)", "one commit", "no edit or delete (BR-19)"]} />
      <ThemeStack>
        <Demo title="S2, 4 commits, v4 Ready. A link sets ?commit= (try v2).">
          <div className="w-full max-w-[640px]">
            <CommitSelector commits={four} selectedId={sel.id} readyId="c4" />
          </div>
        </Demo>
        <Demo title="A2, 8 commits: the 3 newest show, the rest open with the disclosure button. ?commit=2 opens the group.">
          <div className="w-full max-w-[640px]">
            <CommitSelector commits={MANY.map((c) => ({ ...c, uploader: "Student" }))} selectedId={selMany.id} readyId="m8" />
          </div>
        </Demo>
        <Demo title="One commit, not Ready">
          <div className="w-full max-w-[640px]">
            <CommitSelector commits={four.slice(0, 1)} selectedId="c1" />
          </div>
        </Demo>
      </ThemeStack>
    </>
  );
}
