"use client";
// The browser makes the SHA-256 hash and sends the file straight to storage (NFR-02, NFR-12).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { confirmScan, requestScan } from "./actions";

async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function ScanUploader({ milestoneId, requiredItemId, label }: { milestoneId: string; requiredItemId: string; label: string }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

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
    const req = await requestScan({ ...meta, milestoneId, requiredItemId });
    if (!req.link || !req.documentId) return fail(req.error ?? "No upload link.");
    setStatus("Uploading…");
    const put = await fetch(req.link.url, { method: "PUT", headers: req.link.headers, body: file }).catch(() => null);
    if (!put || !put.ok) return fail("Storage refused the upload. Try again.");
    setStatus("Checking the file…");
    const done = await confirmScan({ ...meta, documentId: req.documentId, key: req.link.key });
    if (!done.ok) return fail(done.error ?? "The file check failed.");
    setStatus("Scan saved. It is now locked as submitted.");
    setBusy(false);
    router.refresh();
  }

  const inputId = `scan-${requiredItemId}`;
  return (
    <div className="flex flex-col gap-1">
      <input
        id={inputId}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void onFile(file);
        }}
      />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => document.getElementById(inputId)?.click()}>
        {busy ? "Working…" : `Upload ${label}`}
      </Button>
      <p role="status" aria-live="polite" className={failed ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
        {status}
      </p>
    </div>
  );
}
