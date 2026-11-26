"use client";
// Client parts of C6. A blocked action shows its reason next to the action (BR-18, DESIGN.md §7.4).
// R3.10 (R3-h A, UX-010, BR-19): "Scan matches" and "Close the stage" ask once more in a ConfirmDialog, then send the
// same FormData to the same server action. "Mismatch", "Issue the Minutes" and "Certify" stay one step until R7d.
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { confirmCopy } from "@/components/patterns/dialog/copy";
import { control } from "@/components/patterns/form-field";
import { Button } from "@/components/ui/button";
import { ConfirmButton, Field, ResultSlot, type FormState } from "../../_lib/form-parts";
import { certifyAction, closeDefenseAction, confirmSheetScan, issueMinutesAction, requestSheetScan, verifySheetAction } from "./actions";

// The one form-feedback contract (UX-011). A result shows as "done", an error as role="alert".
const Message = ResultSlot;

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

export function VerifySheetForm({ entryId, blockedReason, form, student }: { entryId: string | null; blockedReason: string | null; form: string; student: string }) {
  const [state, run] = useActionState(verifySheetAction, {});
  const ref = useRef<HTMLFormElement>(null);
  const [confirmed, setConfirmed] = useState<FormState | null>(null);
  return (
    <form ref={ref} action={run} onSubmit={() => setConfirmed(null)} className="flex flex-col gap-2">
      <input type="hidden" name="entryId" value={entryId ?? ""} />
      <div className="flex flex-wrap gap-2">
        <ConfirmButton
          action={verifySheetAction}
          formRef={ref}
          fields={{ result: "matched" }}
          copy={confirmCopy({ kind: "scanMatches", form, student })}
          blockedReason={blockedReason ?? undefined}
          onResult={setConfirmed}
          size="sm"
        >
          Scan matches
        </ConfirmButton>
        <ActionButton type="submit" name="result" value="mismatch" size="sm" variant="outline" blockedReason={blockedReason ?? undefined}>
          Mismatch
        </ActionButton>
      </div>
      <Message state={confirmed ?? state} lines={3} />
    </form>
  );
}

export function MinutesForm({ attemptId, blockedReason }: { attemptId: string; blockedReason: string | null }) {
  const [state, run] = useActionState(issueMinutesAction, {});
  return (
    <form action={run} className="flex max-w-[720px] flex-col gap-3">
      <input type="hidden" name="attemptId" value={attemptId} />
      <Field label="Minutes of the defense" htmlFor="minutes-body" hint="Issued once. The Minutes cannot change after that (BR-19).">
        <textarea id="minutes-body" name="body" rows={6} required className={control.textarea} />
      </Field>
      <ActionButton type="submit" blockedReason={blockedReason ?? undefined}>
        Issue the Minutes
      </ActionButton>
      <Message state={state} />
    </form>
  );
}

export function CloseForm({ milestoneId, blockedReason, student }: { milestoneId: string; blockedReason: string | null; student: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<FormState>({});
  return (
    <form ref={ref} onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-2">
      <input type="hidden" name="milestoneId" value={milestoneId} />
      <ConfirmButton action={closeDefenseAction} formRef={ref} copy={confirmCopy({ kind: "closeStage", student })} blockedReason={blockedReason ?? undefined} onResult={setState}>
        Close the stage
      </ConfirmButton>
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
