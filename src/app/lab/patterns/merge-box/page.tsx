// /lab/patterns/merge-box (Task R5.1): the S2 merge box in each state. The upload is not in the box (R5-b, UX-P-05).
import { BlockedAction } from "@/components/patterns/blocked-action";
import { MergeBox } from "@/components/patterns/merge-box";
import { Button } from "@/components/ui/button";
import { Demo, LabHeader, ThemeStack } from "../../_mock/panels";

export default function Page() {
  return (
    <>
      <LabHeader title="Merge box (R5.1)" round="R5 · UX-P-05" states={["first day (Mark Ready blocked with its reason)", "working (one maroon action)", "Ready (the action becomes its reason)", "locked after Gate 1b (BR-07)", "returned"] } />
      <ThemeStack>
        <Demo title="First day: no commit. Mark Ready shows its reason (BR-18).">
          <div className="w-full max-w-[960px]">
            <MergeBox state="first-day" sentence="Upload your first version as a PDF. Then mark it Ready for your Adviser." action={<BlockedAction type="button" reason="Upload a commit first.">Mark Ready</BlockedAction>} />
          </div>
        </Demo>
        <Demo title="Working: one sentence, one maroon action">
          <div className="w-full max-w-[960px]">
            <MergeBox sentence="Mark v4 Ready when you want your Adviser to read it." action={<Button type="button">Mark Ready</Button>} />
          </div>
        </Demo>
        <Demo title="Ready: the Adviser reads next. No action: its reason shows in its place.">
          <div className="w-full max-w-[960px]">
            <MergeBox state="ready" sentence="Your Adviser reads v4 next. You can upload again after the Adviser decides." action={null} lockedReason="Wait for the Adviser to endorse or return this commit." />
          </div>
        </Demo>
        <Demo title="Locked after Gate 1b (BR-07, SITEMAP §9)">
          <div className="w-full max-w-[960px]">
            <MergeBox state="locked" sentence="Your Evaluation Committee endorsed v4 for the defense." action={null} lockedReason="Locked until the defense is closed." />
          </div>
        </Demo>
        <Demo title="Returned: the Adviser's reason is on the screen above the box (today's header). The box says what to do now.">
          <div className="w-full max-w-[960px]">
            <MergeBox state="returned" sentence="Your Adviser returned v4. Upload a new version, then mark it Ready." action={<BlockedAction type="button" reason="Upload a new commit first.">Mark Ready</BlockedAction>} />
          </div>
        </Demo>
      </ThemeStack>
    </>
  );
}

