// `/adviser/defense/[defenseId]`: the Defense Day page (A5). defenseId is the defense attempt id.
import { DefenseDay } from "@/app/_components/defense-day";

export default async function Page({ params }: PageProps<"/adviser/defense/[defenseId]">) {
  const { defenseId } = await params;
  return <DefenseDay portal="adviser" attemptId={defenseId} />;
}
