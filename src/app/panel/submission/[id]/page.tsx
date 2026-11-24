// `/panel/submission/[id]`: the shared submission view (SV). id is the milestone id.
import { SubmissionViewScreen } from "@/app/_components/submission-view";

export default async function Page({ params }: PageProps<"/panel/submission/[id]">) {
  const { id } = await params;
  return <SubmissionViewScreen milestoneId={id} />;
}
