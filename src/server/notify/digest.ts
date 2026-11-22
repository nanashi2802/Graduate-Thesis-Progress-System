// Digest grouping (FR-NTF-04, FR §3 "digest window 1 day"). Pure code.
// The daily job loads the digest notifications of the last window, drops the ones the
// user turned off (FR-NTF-05), and calls `groupDigests`. Each group becomes one email.

import type { EventCode } from "./events";

export type DigestCode = "B4" | "B7" | "C2" | "C3" | "C4" | "C5";

export type DigestItem = {
  code: DigestCode;
  recipientUserId: string;
  /** The commit the thread or comment belongs to (C2 to C5). */
  commitId: string | null;
  /** True for a Defense Day thread (context C, BR-20). */
  defenseDayThread: boolean;
  /** True when the Final Defense of that thread is closed. */
  defenseClosed: boolean;
};

export type DigestGroup = {
  recipientUserId: string;
  /** `commit` groups C2 to C5 of one commit. `daily` groups B4 and B7. */
  kind: "commit" | "daily";
  commitId: string | null;
  codes: DigestCode[];
  count: number;
};

const COMMIT_CODES: readonly DigestCode[] = ["C2", "C3", "C4", "C5"];
const STUDENT_HELD: readonly DigestCode[] = ["C2", "C3", "C4"];

/**
 * Defense Day threads stay hidden from the Student until the defense closes (INV-23).
 * So the Student's C2 to C4 emails for them wait until then (FR-NTF-04). The caller keeps
 * held items for the next run.
 */
export function isHeld(item: DigestItem, recipientIsStudent: boolean): boolean {
  return item.defenseDayThread && !item.defenseClosed && recipientIsStudent && STUDENT_HELD.includes(item.code);
}

/** One email for each recipient and commit (C2 to C5), and one daily email for each recipient (B4, B7). */
export function groupDigests(items: readonly DigestItem[], isStudent: (userId: string) => boolean): {
  groups: DigestGroup[];
  held: DigestItem[];
} {
  const map = new Map<string, DigestGroup>();
  const held: DigestItem[] = [];
  for (const item of items) {
    if (isHeld(item, isStudent(item.recipientUserId))) {
      held.push(item);
      continue;
    }
    const byCommit = COMMIT_CODES.includes(item.code);
    const key = `${item.recipientUserId}|${byCommit ? `c:${item.commitId}` : "daily"}`;
    let g = map.get(key);
    if (!g) {
      g = {
        recipientUserId: item.recipientUserId,
        kind: byCommit ? "commit" : "daily",
        commitId: byCommit ? item.commitId : null,
        codes: [],
        count: 0,
      };
      map.set(key, g);
    }
    if (!g.codes.includes(item.code)) g.codes.push(item.code);
    g.count += 1;
  }
  for (const g of map.values()) g.codes.sort();
  return { groups: [...map.values()], held };
}

/** The event code whose fixed text heads the digest email: the first code of the group. */
export function digestHeadline(g: DigestGroup): EventCode {
  return g.codes[0] as EventCode;
}
