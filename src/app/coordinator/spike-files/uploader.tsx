"use client";
// The browser hashes the file and sends the bytes straight to storage (NFR-02, NFR-12).
import dynamic from "next/dynamic";
import { useState } from "react";
import type { UploadLink } from "@/server/files/storage";
import { confirmUpload, requestUploadLink } from "./actions";

const PdfViewer = dynamic(() => import("./pdf-viewer"), { ssr: false });

async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function Uploader() {
  const [status, setStatus] = useState("");
  const [readUrl, setReadUrl] = useState<string>();
  const [last, setLast] = useState<{ link: UploadLink; file: File }>();

  async function put(link: UploadLink, file: File): Promise<number> {
    const res = await fetch(link.url, { method: "PUT", headers: link.headers, body: file });
    return res.status;
  }

  async function onFile(file: File) {
    setReadUrl(undefined);
    setStatus("Making the hash…");
    const sha256 = await sha256Hex(file);
    const { link, error } = await requestUploadLink({ kind: "manuscript", sha256, size: file.size, contentType: file.type });
    if (!link) return setStatus(error ?? "No upload link.");
    setStatus("Uploading to storage…");
    const code = await put(link, file);
    if (code !== 200) return setStatus(`Storage refused the upload (HTTP ${code}).`);
    const checked = await confirmUpload(link.key, sha256, file.size);
    if (!checked.readUrl) return setStatus(checked.error ?? "The hash check failed.");
    setLast({ link, file });
    setStatus(`Hash checked. Key ${link.key}`);
    setReadUrl(checked.readUrl);
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Manuscript PDF
        <input type="file" accept="application/pdf" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </label>
      <p role="status">{status}</p>
      {last && (
        <button
          type="button"
          className="self-start text-sm underline"
          onClick={async () => setStatus(`Second upload to the same key: HTTP ${await put(last.link, last.file)}`)}
        >
          Upload again to the same key (must fail)
        </button>
      )}
      {readUrl && <PdfViewer url={readUrl} />}
    </div>
  );
}
