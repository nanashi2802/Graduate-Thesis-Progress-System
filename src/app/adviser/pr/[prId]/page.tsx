// `/adviser/pr/[prId]`: the shared PR workspace (S2, A2, P2).
import { PrWorkspace } from "@/app/_components/pr-workspace";

export default async function Page({ params, searchParams }: PageProps<"/adviser/pr/[prId]">) {
  const { prId } = await params;
  const { commit } = await searchParams;
  return <PrWorkspace prId={prId} commit={typeof commit === "string" ? commit : undefined} />;
}
