// The loading shape of PROCESS (R4.4, UX-D-15): the title, then the four steps.
import { PageLoadingBlocks } from "@/components/patterns/loading";

export default function Loading() {
  return <PageLoadingBlocks kind="process" label="Loading the thesis process" />;
}
