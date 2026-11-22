// `/panel/defense/[defenseId]`: the Defense Day page (P4). defenseId is the defense attempt id.
import { DefenseDay } from "@/app/_components/defense-day";

export default async function Page({ params }: PageProps<"/panel/defense/[defenseId]">) {
  const { defenseId } = await params;
  return <DefenseDay attemptId={defenseId} />;
}
