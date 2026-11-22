"use client";
// Client parts of C6. A blocked action shows its reason next to the action (BR-18, DESIGN.md §7.4).
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { Button } from "@/components/ui/button";
import { Field, fieldClass, type FormState } from "../../_lib/form-parts";
import { certifyAction, closeDefenseAction, confirmSheetScan, issueMinutesAction, requestSheetScan, verifySheetAction } from "./actions";

function Message({ state }: { state: FormState }) {
  return (
    <p role="status" aria-live="polite" className={state.error ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
      {state.error ?? state.ok ?? ""}
    </p>
  );
}

async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The browser hashes the signed sheet and sends it straight to storage (NFR-02, NFR-12). */
export function SheetScanUploader({ entryId, name, blockedReason }: { entryId: string | null; name: string; blockedReason: string | null }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const inputId = `sheet-${entryId ?? name}`;
  // Only an entry that exists and is not verified takes a scan. "Upload the signed scan first." is not a reason to block the upload.
  const uploadBlock = !entryId ? "The member has not saved the sheet yet." : blockedReason === "This sheet is verified. It cannot change." || blockedReason === "The defense of this sheet is closed." ? blockedReason : null;
  if (uploadBlock) {
    return (
      <ActionButton type="button" size="sm" variant="outline" blockedReason={uploadBlock}>
        Upload the signed scan
      </ActionButton>
    );
  }
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
    const req = await requestSheetScan({ ...meta, entryId: entryId! });
    if (!req.link) return fail(req.error ?? "No upload link.");
    setStatus("Uploading…");
    const put = await fetch(req.link.url, { method: "PUT", headers: req.link.headers, body: file }).catch(() => null);
    if (!put || !put.ok) return fail("Storage refused the upload. Try again.");
    const done = await confirmSheetScan({ ...meta, entryId: entryId!, key: req.link.key });
    if (!done.ok) return fail(done.error ?? "The file check failed.");
    setStatus("Scan saved.");
    setBusy(false);
    router.refresh();
  }
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
        {busy ? "Working…" : "Upload the signed scan"}
      </Button>
      <p role="status" aria-live="polite" className={failed ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
        {status}
      </p>
    </div>
  );
}

export function VerifySheetForm({ entryId, blockedReason }: { entryId: string | null; blockedReason: string | null }) {
  const [state, run] = useActionState(verifySheetAction, {});
  return (
    <form action={run} className="flex flex-col gap-2">
      <input type="hidden" name="entryId" value={entryId ?? ""} />
      <div className="flex flex-wrap gap-2">
        <ActionButton type="submit" name="result" value="matched" size="sm" blockedReason={blockedReason ?? undefined}>
          Scan matches
        </ActionButton>
        <ActionButton type="submit" name="result" value="mismatch" size="sm" variant="outline" blockedReason={blockedReason ?? undefined}>
          Mismatch
        </ActionButton>
      </div>
      <Message state={state} />
    </form>
  );
}

export function MinutesForm({ attemptId, blockedReason }: { attemptId: string; blockedReason: string | null }) {
  const [state, run] = useActionState(issueMinutesAction, {});
  return (
    <form action={run} className="flex max-w-[720px] flex-col gap-3">
      <input type="hidden" name="attemptId" value={attemptId} />
      <Field label="Minutes of the defense" htmlFor="minutes-body" hint="Issued once. The Minutes cannot change after that (BR-19).">
        <textarea id="minutes-body" name="body" rows={6} required className={`${fieldClass} h-auto py-2`} />
      </Field>
      <ActionButton type="submit" blockedReason={blockedReason ?? undefined}>
        Issue the Minutes
      </ActionButton>
      <Message state={state} />
    </form>
  );
}

export function CloseForm({ milestoneId, blockedReason }: { milestoneId: string; blockedReason: string | null }) {
  const [state, run] = useActionState(closeDefenseAction, {});
  return (
    <form action={run} className="flex flex-col gap-2">
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <ActionButton type="submit" blockedReason={blockedReason ?? undefined}>
        Close the stage
      </ActionButton>
      <Message state={state} />
    </form>
  );
}

export function CertifyForm({ milestoneId, blockedReason }: { milestoneId: string; blockedReason: string | null }) {
  const [state, run] = useActionState(certifyAction, {});
  return (
    <form action={run} className="flex flex-col gap-2">
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <ActionButton type="submit" blockedReason={blockedReason ?? undefined}>
        Record the Certification
      </ActionButton>
      <Message state={state} />
    </form>
  );
}
