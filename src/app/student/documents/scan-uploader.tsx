"use client";
// The browser makes the SHA-256 hash and sends the file straight to storage (NFR-02, NFR-12).
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdvisingForm } from "@/server/data/documents";
import { confirmScan, requestAdvisingCopy, requestScan } from "./actions";

async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// One target: a template item of the milestone, or an optional advising-form copy (FR-DOC-12, D-25).
type Target = { milestoneId: string; requiredItemId: string; advisingForm?: undefined } | { advisingForm: AdvisingForm; milestoneId?: undefined; requiredItemId?: undefined };

export function ScanUploader({ label, ...target }: Target & { label: string }) {
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
    const req = target.advisingForm
      ? await requestAdvisingCopy({ ...meta, formCode: target.advisingForm })
      : await requestScan({ ...meta, milestoneId: target.milestoneId, requiredItemId: target.requiredItemId });
    if (!req.link || !req.documentId) return fail(req.error ?? "No upload link.");
    setStatus("Uploading…");
    const put = await fetch(req.link.url, { method: "PUT", headers: req.link.headers, body: file }).catch(() => null);
    if (!put || !put.ok) return fail("Storage refused the upload. Try again.");
    setStatus("Checking the file…");
    const done = await confirmScan({ ...meta, documentId: req.documentId, key: req.link.key });
    if (!done.ok) return fail(done.error ?? "The file check failed.");
    setStatus(target.advisingForm ? "Copy saved. It is kept for your record." : "Scan saved. It is now locked as submitted.");
    setBusy(false);
    router.refresh();
  }

  const inputId = `scan-${target.requiredItemId ?? target.advisingForm}`;
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
