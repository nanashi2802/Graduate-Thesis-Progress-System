"use server";
// P0-E04 spike: signed upload, hash check and signed read (NFR-01, NFR-02, NFR-12, DFD T1 to T5).
// Throwaway spike code (BUILD_PLAN §2). P1-E06 replaces it with commit uploads (AD-A-009).
import { getSessionState } from "@/server/auth/session";
import { checkStoredFile, createReadLink, createUploadLink, type UploadLink } from "@/server/files/storage";
import { uploadProblem, type UploadRequest } from "@/server/files/rules";

// NFR-01: each action checks access on the server. The spike is for the Coordinator only.
async function requireCoordinator(): Promise<void> {
  const state = await getSessionState();
  if (state.status !== "ok" || !state.actor.isActive || state.actor.role !== "coordinator") {
    throw new Error("Access denied: the file spike is for the Coordinator only");
  }
}

export async function requestUploadLink(req: UploadRequest): Promise<{ link?: UploadLink; error?: string }> {
  await requireCoordinator();
  const problem = uploadProblem(req);
  if (problem) return { error: problem };
  return { link: await createUploadLink(req) };
}

// T3 then T5. A real upload makes the file record here, only after the hash check (T4).
export async function confirmUpload(key: string, sha256: string, size: number): Promise<{ readUrl?: string; error?: string }> {
  await requireCoordinator();
  if (!(await checkStoredFile(key, sha256, size))) {
    return { error: "The stored file does not match the hash from your browser. No record is made." };
  }
  return { readUrl: await createReadLink(key) };
}
