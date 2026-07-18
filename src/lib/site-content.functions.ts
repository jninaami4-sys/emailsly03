/**
 * Site content — thin proxies to PHP API (Batch 5 migration).
 */
import { siteContentApi, adminSiteContentApi } from "@/lib/api-client";

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
export type SiteContentMap = { [section: string]: { [k: string]: JsonValue } };

type Empty = Record<string, never>;

export async function listSiteContent(_?: { data?: Empty }): Promise<SiteContentMap> {
  const { sections } = await siteContentApi.list();
  const map: SiteContentMap = {};
  for (const row of sections ?? []) {
    if (row && typeof row === "object" && "section" in row) {
      const r = row as { section: string; data?: Record<string, JsonValue> };
      map[r.section] = (r.data ?? {}) as { [k: string]: JsonValue };
    }
  }
  return map;
}

export async function upsertSiteContent(args: {
  data: { section: string; data: Record<string, unknown> };
}): Promise<{ ok: true }> {
  await adminSiteContentApi.upsert(args.data.section, args.data.data);
  return { ok: true };
}
