"use client";
// The browser makes the SHA-256 hash and sends the PDF straight to storage (FR-REV-02, NFR-02, NFR-12).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { confirmCommit, requestCommit } from "@/app/_lib/pr-actions";
import { Button } from "@/components/ui/button";

async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function CommitUploader({ milestoneId, openThreads }: { milestoneId: string; openThreads: { id: string; label: string }[] }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  async function onFile(file: File) {
    setBusy(true);
    setFailed(false);
    const fail = (msg: string) => {
      setStatus(msg);
      setFailed(true);
      setBusy(false);
    };
    setStatus("Making the hash…");
    const meta = { sha256: await sha256Hex(file), size: file.size, contentType: file.type };
    const req = await requestCommit({ ...meta, milestoneId });
    if (!req.link) return fail(req.error ?? "No upload link.");
    setStatus("Uploading…");
    const put = await fetch(req.link.url, { method: "PUT", headers: req.link.headers, body: file }).catch(() => null);
    if (!put || !put.ok) return fail("Storage refused the upload. Try again.");
    setStatus("Checking the file…");
    const done = await confirmCommit({ ...meta, milestoneId, key: req.link.key, changeNote: note, addressesThreadIds: tags });
    if (!done.ok) return fail(done.error ?? "The file check failed.");
    setStatus("The new commit is saved. Mark it Ready when it is final.");
    setNote("");
    setTags([]);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 rounded-control border border-border p-3">
      <p className="text-sm font-medium">Upload a new commit</p>
      <label className="flex flex-col gap-1 text-sm">
        Change note (optional)
        <textarea className="min-h-16 rounded-control border border-input bg-card p-2 text-sm" value={note} onChange={(e) => setNote(e.target.value)} disabled={busy} />
      </label>
      {openThreads.length > 0 ? (
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="font-medium">Threads this commit addresses</legend>
          {openThreads.map((t) => (
            <label key={t.id} className="flex items-start gap-2">
              <input type="checkbox" checked={tags.includes(t.id)} disabled={busy} onChange={(e) => setTags(e.target.checked ? [...tags, t.id] : tags.filter((x) => x !== t.id))} />
              <span>{t.label}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      <input
        id="commit-file"
        type="file"
        accept="application/pdf"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void onFile(file);
        }}
      />
      <Button type="button" variant="outline" size="sm" className="self-start" disabled={busy} onClick={() => document.getElementById("commit-file")?.click()}>
        {busy ? "Working…" : "Choose a PDF"}
      </Button>
      <p role="status" aria-live="polite" className={failed ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
        {status}
      </p>
    </div>
  );
}
