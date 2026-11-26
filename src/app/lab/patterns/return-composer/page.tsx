// /lab/patterns/return-composer (Task R3.4): the inline Return composer of C4 to C7. Empty (Send return blocked with
// its reason), with text (type in it), a server error in the slot, and the on-screen result after sending.
import { ReturnResult } from "@/components/patterns/return-composer";
import { Demo, LabHeader, ThemePanels } from "../../_mock/panels";
import { ComposerDemo } from "../../_mock/r3-demos";

export default function Page() {
  return (
    <>
      <LabHeader
        title="Return composer (R3.4)"
        round="R3 · UX-P-03"
        states={["empty: Send return blocked (Write a reason first)", "spaces only count as empty", "with text", "server error in the slot", "result on the screen"]}
      />
      <ThemePanels>
        <Demo title="Live: type a reason, then Send return (the result replaces the composer)">
          <ComposerDemo mode="empty" />
        </Demo>
        <Demo title="Live: the server refuses (the error stays in the slot, the text stays)">
          <ComposerDemo mode="error" />
        </Demo>
        <Demo title="The result (UX-D-04: never a toast)">
          <div className="w-[300px]">
            <ReturnResult student="Dino Aquino" reason="The Adviser signature on page 2 is missing. Upload a new scan with the signature." at={new Date("2027-01-12T01:20:00Z")} />
          </div>
        </Demo>
      </ThemePanels>
    </>
  );
}
