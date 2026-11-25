"use server";
// S3 actions: the signed upload link and the hash check for a scan (FR-DOC-03, NFR-01, NFR-02, NFR-12).
// The browser sends the bytes to storage. The server never gets them.
import { revalidatePath } from "next/cache";
import { getSessionState } from "@/server/auth/session";
import { AccessDeniedError } from "@/server/data/access";
import { getDb } from "@/server/data/db";
import { confirmScanUpload, requestAdvisingCopyUpload, requestScanUpload, type AdvisingForm } from "@/server/data/documents";
import { checkStoredFile, createUploadLink, type UploadLink } from "@/server/files/storage";

const files = { createUploadLink, checkStoredFile };

async function context() {
  const state = await getSessionState();
  if (state.status !== "ok") throw new AccessDeniedError("sign in first");
  return { db: getDb(), actor: state.actor };
}

type Meta = { sha256: string; size: number; contentType: string };

export async function requestScan(input: Meta & { milestoneId: string; requiredItemId: string }): Promise<{ documentId?: string; link?: UploadLink; error?: string }> {
  try {
    const res = await requestScanUpload(await context(), { ...input, subjectUserId: null }, files);
    return res.ok ? { documentId: res.value.documentId, link: res.value.link } : { error: res.reason };
  } catch (e) {
    return { error: e instanceof AccessDeniedError ? "You cannot upload this document." : "The system could not start the upload. Try again." };
  }
}

// FR-DOC-12, D-25: an optional, write-once copy of an advising form. Nobody reviews it.
export async function requestAdvisingCopy(input: Meta & { formCode: AdvisingForm }): Promise<{ documentId?: string; link?: UploadLink; error?: string }> {
  try {
    const res = await requestAdvisingCopyUpload(await context(), input, files);
    return res.ok ? { documentId: res.value.documentId, link: res.value.link } : { error: res.reason };
  } catch (e) {
    return { error: e instanceof AccessDeniedError ? "You cannot upload this copy." : "The system could not start the upload. Try again." };
  }
}

export async function confirmScan(input: Meta & { documentId: string; key: string }): Promise<{ ok?: true; error?: string }> {
  try {
    const res = await confirmScanUpload(await context(), input, files);
    if (!res.ok) return { error: res.reason };
    revalidatePath("/student/documents");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof AccessDeniedError ? "You cannot upload this document." : "The system could not save the scan. Try the upload again." };
  }
}
