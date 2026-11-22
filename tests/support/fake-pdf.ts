// A fake manuscript PDF for tests (AGENTS.md §11: fake data only).
// Each page has one line of text and one random grey image, like a scanned page.
// The random image does not compress, so 100 pages are about 5.3 MB (over the 4.5 MB
// Vercel body limit, so the test proves the bytes do not go through the server).
import { randomBytes } from "node:crypto";

export function makeFakePdf(pages = 100, imageSide = 230): Buffer {
  const parts: Buffer[] = [];
  const offsets: number[] = [];
  let size = 0;
  const push = (b: Buffer | string) => {
    const buf = typeof b === "string" ? Buffer.from(b, "latin1") : b;
    parts.push(buf);
    size += buf.length;
  };
  const obj = (n: number, body: Buffer | string) => {
    offsets[n] = size;
    push(`${n} 0 obj\n`);
    push(body);
    push("\nendobj\n");
  };
  const stream = (dict: string, data: Buffer) =>
    Buffer.concat([Buffer.from(`<< ${dict} /Length ${data.length} >>\nstream\n`, "latin1"), data, Buffer.from("\nendstream", "latin1")]);

  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const firstPage = 4;
  const kids = Array.from({ length: pages }, (_, i) => `${firstPage + i * 3} 0 R`).join(" ");
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Kids [${kids}] /Count ${pages} >>`);
  obj(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  for (let i = 0; i < pages; i++) {
    const p = firstPage + i * 3;
    obj(
      p,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${p + 1} 0 R ` +
        `/Resources << /Font << /F1 3 0 R >> /XObject << /Im1 ${p + 2} 0 R >> >> >>`,
    );
    const text = `BT /F1 24 Tf 72 720 Td (Fake manuscript page ${i + 1}) Tj ET q 300 0 0 300 156 300 cm /Im1 Do Q`;
    obj(p + 1, stream("", Buffer.from(text, "latin1")));
    obj(
      p + 2,
      stream(
        `/Type /XObject /Subtype /Image /Width ${imageSide} /Height ${imageSide} /ColorSpace /DeviceGray /BitsPerComponent 8`,
        randomBytes(imageSide * imageSide),
      ),
    );
  }
  const count = firstPage + pages * 3;
  const xref = size;
  push(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let n = 1; n < count; n++) push(`${String(offsets[n]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return Buffer.concat(parts);
}
