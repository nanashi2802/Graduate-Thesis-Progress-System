// `/panel/pr/[prId]`: the shared PR workspace (S2, A2, P2).
import { PrWorkspace } from "@/app/_components/pr-workspace";

export default async function Page({ params, searchParams }: PageProps<"/panel/pr/[prId]">) {
  const { prId } = await params;
  const { commit, page } = await searchParams;
  return <PrWorkspace portal="panel_member" prId={prId} commit={typeof commit === "string" ? commit : undefined} page={typeof page === "string" ? page : undefined} />;
}
