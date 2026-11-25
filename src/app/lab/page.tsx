// The /lab index: every showcase page with its round and its gate (Task 2.1).
import Link from "next/link";
import { GATES, LAB_PAGES } from "./_mock/pages";

export default function LabIndex() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-[28px] leading-9 font-semibold">UI/UX retrofit lab</h1>
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          Previews of each round with mock data. The owner approves a round here before it changes a live page.
        </p>
      </header>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {["Page", "Round", "Gate", "Gate state"].map((h) => (
              <th key={h} scope="col" className="border-b border-border px-3 py-2 text-left font-semibold text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {LAB_PAGES.map((p) => (
            <tr key={p.path} className="h-12">
              <td className="border-b border-border px-3">
                {p.built ? (
                  <Link className="text-primary underline-offset-4 hover:underline" href={p.path}>
                    {p.title}
                  </Link>
                ) : (
                  <span>
                    {p.title} <span className="text-muted-foreground">(not built yet)</span>
                  </span>
                )}
              </td>
              <td className="border-b border-border px-3 font-mono">{p.round}</td>
              <td className="border-b border-border px-3 font-mono">{p.gate}</td>
              <td className="border-b border-border px-3">{GATES[p.gate] ?? "Not shown"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
