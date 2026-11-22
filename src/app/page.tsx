import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

// Phase 0 placeholder (P0-E01). Real routes come from SITEMAP.md in Phase 1.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">PUP CpE Thesis Progress</h1>
      <p className="text-muted-foreground">Technical spike. This page holds no data.</p>
      <div>
        <Button variant="outline" disabled title="The spike has no actions yet.">
          <CircleCheck aria-hidden />
          Scaffold ready
        </Button>
      </div>
    </main>
  );
}
