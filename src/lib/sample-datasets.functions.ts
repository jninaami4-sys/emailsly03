import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";
import rawApollo from "@/lib/apollo-leads-raw.json";
import rawLinkedin from "@/lib/linkedin-leads-raw.json";
import rawZoominfo from "@/lib/zoominfo-leads-raw.json";

const SOURCES = ["apollo", "linkedin", "zoominfo"] as const;
export type SourceKey = (typeof SOURCES)[number];

export type ParsedCsv = {
  headers: string[];
  rows: Record<string, string | number | boolean>[];
};

export type SampleDatasetConfig = {
  source: SourceKey;
  source_type: "builtin" | "gdrive" | "upload";
  gdrive_url: string | null;
  storage_path: string | null;
  display_name: string;
  row_count_hint: number | null;
  updated_at: string;
};

export type SampleDatasetsPayload = {
  data: Record<SourceKey, ParsedCsv>;
  meta: Record<SourceKey, {
    source_type: "builtin" | "gdrive" | "upload";
    display_name: string;
    updated_at: string;
    row_count: number;
    error: string | null;
  }>;
  totalRows: number;
};

const BUILTIN: Record<SourceKey, ParsedCsv> = {
  apollo: rawApollo as ParsedCsv,
  linkedin: rawLinkedin as ParsedCsv,
  zoominfo: rawZoominfo as ParsedCsv,
};

// ------- helpers -------

function serverAnonClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function parseCsv(text: string): ParsedCsv {
  // Robust-enough parser: quoted fields, embedded newlines, doubled quotes.
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        cur.push(field); field = "";
        rows.push(cur); cur = [];
      } else field += c;
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  const filtered = rows.filter((r) => r.some((v) => v.trim() !== ""));
  if (filtered.length === 0) return { headers: [], rows: [] };
  const headers = filtered[0].map((h) => h.trim());
  const dataRows = filtered.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = r[idx] ?? ""; });
    return obj;
  });
  return { headers, rows: dataRows };
}

function gdriveDirectUrl(input: string): string {
  const m1 = input.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return `https://drive.usercontent.google.com/download?id=${m1[1]}&export=download`;
  const m2 = input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return `https://drive.usercontent.google.com/download?id=${m2[1]}&export=download`;
  return input;
}

type CacheEntry = { at: number; parsed: ParsedCsv };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000;

async function fetchAndParse(url: string): Promise<ParsedCsv> {
  const now = Date.now();
  const hit = cache.get(url);
  if (hit && now - hit.at < TTL_MS) return hit.parsed;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Fetch ${res.status}`);
  const text = await res.text();
  if (text.trim().startsWith("<")) throw new Error("Not a CSV (got HTML — is the Drive file public?)");
  const parsed = parseCsv(text);
  cache.set(url, { at: now, parsed });
  return parsed;
}

async function loadForSource(
  cfg: SampleDatasetConfig,
): Promise<{ parsed: ParsedCsv; error: string | null }> {
  try {
    if (cfg.source_type === "gdrive" && cfg.gdrive_url) {
      return { parsed: await fetchAndParse(gdriveDirectUrl(cfg.gdrive_url)), error: null };
    }
    if (cfg.source_type === "upload" && cfg.storage_path) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin.storage
        .from("sample-datasets")
        .download(cfg.storage_path);
      if (error || !data) throw new Error(error?.message || "download failed");
      const text = await data.text();
      return { parsed: parseCsv(text), error: null };
    }
  } catch (e) {
    return {
      parsed: BUILTIN[cfg.source],
      error: e instanceof Error ? e.message : "load failed",
    };
  }
  return { parsed: BUILTIN[cfg.source], error: null };
}

// ------- public -------

export const getSampleDatasets = createServerFn({ method: "GET" }).handler(
  async (): Promise<SampleDatasetsPayload> => {
    const supa = serverAnonClient();
    const { data } = await supa
      .from("sample_datasets")
      .select("source, source_type, gdrive_url, storage_path, display_name, row_count_hint, updated_at");
    const byKey = new Map<string, SampleDatasetConfig>();
    for (const row of (data ?? []) as SampleDatasetConfig[]) byKey.set(row.source, row);

    const out = {} as Record<SourceKey, ParsedCsv>;
    const meta = {} as SampleDatasetsPayload["meta"];
    let total = 0;
    for (const source of SOURCES) {
      const cfg = byKey.get(source) ?? {
        source, source_type: "builtin" as const, gdrive_url: null, storage_path: null,
        display_name: source, row_count_hint: null, updated_at: new Date().toISOString(),
      };
      const { parsed, error } = await loadForSource(cfg);
      out[source] = parsed;
      meta[source] = {
        source_type: cfg.source_type,
        display_name: cfg.display_name,
        updated_at: cfg.updated_at,
        row_count: parsed.rows.length,
        error,
      };
      total += parsed.rows.length;
    }
    return { data: out, meta, totalRows: total };
  },
);

// ------- admin -------

async function assertAdmin(supabase: ReturnType<typeof serverAnonClient>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const adminListSampleDatasets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SampleDatasetConfig[]> => {
    await assertAdmin(context.supabase as unknown as ReturnType<typeof serverAnonClient>, context.userId);
    const { data, error } = await context.supabase
      .from("sample_datasets")
      .select("source, source_type, gdrive_url, storage_path, display_name, row_count_hint, updated_at")
      .order("source", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as SampleDatasetConfig[];
  });

const upsertSchema = z.object({
  source: z.enum(["apollo", "linkedin", "zoominfo"]),
  source_type: z.enum(["builtin", "gdrive", "upload"]),
  gdrive_url: z.string().trim().max(500).nullable().optional(),
  storage_path: z.string().trim().max(500).nullable().optional(),
  display_name: z.string().trim().min(1).max(80),
});

export const adminUpsertSampleDataset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as unknown as ReturnType<typeof serverAnonClient>, context.userId);
    const { error } = await context.supabase
      .from("sample_datasets")
      .update({
        source_type: data.source_type,
        gdrive_url: data.gdrive_url ?? null,
        storage_path: data.storage_path ?? null,
        display_name: data.display_name,
      })
      .eq("source", data.source);
    if (error) throw new Error(error.message);
    // clear cache for the new URL & any prior
    cache.clear();
    return { ok: true };
  });

const uploadSchema = z.object({
  source: z.enum(["apollo", "linkedin", "zoominfo"]),
  filename: z.string().trim().min(1).max(200),
  contentBase64: z.string().min(1),
});

export const adminUploadSampleCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => uploadSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as unknown as ReturnType<typeof serverAnonClient>, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const buf = Buffer.from(data.contentBase64, "base64");
    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${data.source}/${Date.now()}-${safeName}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("sample-datasets")
      .upload(path, buf, { contentType: "text/csv", upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { error: dbErr } = await supabaseAdmin
      .from("sample_datasets")
      .update({ source_type: "upload", storage_path: path })
      .eq("source", data.source);
    if (dbErr) throw new Error(dbErr.message);
    cache.clear();
    return { ok: true, storage_path: path };
  });
