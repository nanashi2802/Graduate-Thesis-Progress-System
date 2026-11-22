import { describe, expect, it } from "vitest";
import { groupDigests, isHeld, type DigestItem } from "@/server/notify/digest";

const item = (p: Partial<DigestItem>): DigestItem => ({
  code: "C2",
  recipientUserId: "stu",
  commitId: "k1",
  defenseDayThread: false,
  defenseClosed: false,
  ...p,
});
const isStudent = (u: string) => u === "stu";

describe("groupDigests (FR-NTF-04)", () => {
  it("groups C2 to C5 into one email for each recipient and commit", () => {
    const { groups } = groupDigests(
      [item({}), item({ code: "C4" }), item({ code: "C2" }), item({ commitId: "k2" }), item({ code: "C5", recipientUserId: "adv" })],
      isStudent,
    );
    expect(groups).toHaveLength(3);
    expect(groups.find((g) => g.recipientUserId === "stu" && g.commitId === "k1")).toMatchObject({
      kind: "commit",
      codes: ["C2", "C4"],
      count: 3,
    });
  });

  it("groups B4 and B7 into one daily email for each recipient", () => {
    const { groups } = groupDigests(
      [
        item({ code: "B4", recipientUserId: "pm", commitId: null }),
        item({ code: "B7", recipientUserId: "pm", commitId: "k1" }),
        item({ code: "B4", recipientUserId: "stu", commitId: null }),
      ],
      isStudent,
    );
    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.recipientUserId === "pm")).toMatchObject({ kind: "daily", commitId: null, codes: ["B4", "B7"], count: 2 });
  });

  it("holds the Student's Defense Day thread emails until the defense closes (INV-23, BR-20)", () => {
    const open = item({ defenseDayThread: true });
    expect(isHeld(open, true)).toBe(true);
    expect(isHeld({ ...open, defenseClosed: true }, true)).toBe(false);
    expect(isHeld({ ...open, recipientUserId: "pm", code: "C3" }, false)).toBe(false);
    expect(isHeld({ ...open, code: "C5" }, true)).toBe(false);

    const { groups, held } = groupDigests([open, item({ code: "C3", recipientUserId: "pm", defenseDayThread: true })], isStudent);
    expect(held).toEqual([open]);
    expect(groups.map((g) => g.recipientUserId)).toEqual(["pm"]);
  });
});
