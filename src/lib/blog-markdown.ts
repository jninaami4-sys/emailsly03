import type { PostBlock } from "./blog-posts";

/**
 * Markdown-lite → PostBlock[] parser used by the admin blog editor.
 *
 * Supported syntax (each block separated by a blank line, except list rows):
 *   ## Heading           → h2
 *   ### Sub heading      → h3
 *   - item / * item      → ul (consecutive rows grouped)
 *   1. item              → ol (consecutive rows grouped)
 *   > quote text         → quote  (trailing "— cite" becomes cite)
 *   !!! Title | body     → callout
 *   anything else        → p
 */
export function parseBlogMarkdown(src: string): PostBlock[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: PostBlock[] = [];
  let i = 0;
  const flushPara = (buf: string[]) => {
    const text = buf.join(" ").trim();
    if (text) blocks.push({ type: "p", text });
  };
  let para: string[] = [];
  const flush = () => {
    flushPara(para);
    para = [];
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      flush();
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      blocks.push({ type: "h3", text: line.slice(4).trim() });
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      flush();
      blocks.push({ type: "h2", text: line.slice(2).trim() });
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }
    if (line.startsWith("> ")) {
      flush();
      const parts: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        parts.push(lines[i].trim().slice(2));
        i++;
      }
      const joined = parts.join(" ").trim();
      const m = joined.match(/^(.*?)\s+[—-]\s+([^—-]+)$/);
      if (m) blocks.push({ type: "quote", text: m[1].trim(), cite: m[2].trim() });
      else blocks.push({ type: "quote", text: joined });
      continue;
    }
    if (line.startsWith("!!!")) {
      flush();
      const body = line.slice(3).trim();
      const [title, ...rest] = body.split("|");
      blocks.push({
        type: "callout",
        title: (title ?? "Note").trim(),
        text: rest.join("|").trim(),
      });
      i++;
      continue;
    }
    para.push(line);
    i++;
  }
  flush();
  return blocks;
}

/** Rough word-count based reading estimate (200 wpm). */
export function estimateReadingMinutes(src: string): number {
  const words = src.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Extract h3 items ending in "?" plus the paragraph directly beneath, for FAQ schema. */
export function extractFaqPairs(blocks: PostBlock[]): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === "h3" && b.text.trim().endsWith("?")) {
      const next = blocks[i + 1];
      if (next && next.type === "p") out.push({ q: b.text.trim(), a: next.text.trim() });
    }
  }
  return out;
}