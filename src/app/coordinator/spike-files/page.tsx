// `/coordinator/spike-files`: P0-E04 spike screen, not in SITEMAP. Removed in P1-E06 (AD-A-009).
import { Uploader } from "./uploader";

export default function Page() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">File spike</h1>
      <Uploader />
    </main>
  );
}
