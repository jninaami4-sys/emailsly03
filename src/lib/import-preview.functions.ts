import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function extractDriveId(input: string): string | null {
  const s = input.trim();
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return s;
  const m1 = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];
  const m3 = s.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (m3) return m3[1];
  return null;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB safety cap

export const fetchPublicDriveFile = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ url: z.string().trim().min(3).max(600) }).parse(data))
  .handler(async ({ data }) => {
    const id = extractDriveId(data.url);
    if (!id) throw new Error("Could not find a Google Drive file ID in that URL.");
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${id}`;
    const res = await fetch(downloadUrl, { redirect: "follow" });
    if (!res.ok) throw new Error(`Drive returned ${res.status}. Make sure the file is shared as "Anyone with the link".`);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) throw new Error("File is larger than 10 MB.");
    const contentType = res.headers.get("content-type") ?? "application/octet-stream";
    if (contentType.includes("text/html")) {
      throw new Error("Drive returned an HTML page instead of the file — the link is likely private or blocked by a virus-scan prompt.");
    }
    const bytes = new Uint8Array(buf);
    let base64 = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      base64 += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return {
      fileId: id,
      contentType,
      size: buf.byteLength,
      base64: btoa(base64),
    };
  });
