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
  apollo: rawApollo as unknown as ParsedCsv,
  linkedin: rawLinkedin as unknown as ParsedCsv,
  zoominfo: rawZoominfo as unknown as ParsedCsv,
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
    const obj: Record<string, string | number | boolean> = {};
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

function requestMeta(): { ip: string | null; userAgent: string | null } {
  try {
    // Lazy import to avoid circular type issues; getRequest is available inside handlers.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequest } = require("@tanstack/react-start/server") as {
      getRequest: () => Request;
    };
    const req = getRequest();
    const h = req.headers;
    const ip =
      h.get("cf-connecting-ip") ??
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null;
    return { ip, userAgent: h.get("user-agent") };
  } catch {
    return { ip: null, userAgent: null };
  }
}

type JsonValue =
  | string | number | boolean | null
  | { [k: string]: JsonValue }
  | JsonValue[];

async function writeAudit(params: {
  userId: string;
  email: string | null;
  source: string;
  action: string;
  details: JsonValue;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const meta = requestMeta();
    await supabaseAdmin.from("sample_dataset_audit").insert({
      actor_id: params.userId,
      actor_email: params.email,
      source: params.source,
      action: params.action,
      details: params.details,
      ip_address: meta.ip,
      user_agent: meta.userAgent,
    });
  } catch {
    // eslint-disable-next-line no-console
    console.warn("[sample-datasets] audit write failed");
  }
}

function actorEmail(claims: unknown): string | null {
  if (claims && typeof claims === "object" && "email" in claims) {
    const v = (claims as { email?: unknown }).email;
    return typeof v === "string" ? v : null;
  }
  return null;
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

    // capture previous state for audit diff
    const { data: prev } = await context.supabase
      .from("sample_datasets")
      .select("source_type, gdrive_url, storage_path, display_name")
      .eq("source", data.source)
      .maybeSingle();

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
    cache.clear();

    await writeAudit({
      userId: context.userId,
      email: actorEmail(context.claims),
      source: data.source,
      action: "config_updated",
      details: {
        previous: prev ?? null,
        next: {
          source_type: data.source_type,
          gdrive_url: data.gdrive_url ?? null,
          storage_path: data.storage_path ?? null,
          display_name: data.display_name,
        },
      },
    });

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

    await writeAudit({
      userId: context.userId,
      email: actorEmail(context.claims),
      source: data.source,
      action: "csv_uploaded",
      details: {
        filename: data.filename,
        stored_as: path,
        size_bytes: buf.byteLength,
      },
    });

    return { ok: true, storage_path: path };
  });

// ------- audit log -------

export type AuditEntry = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  source: string;
  action: string;
  details: JsonValue;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export const adminListSampleDatasetAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AuditEntry[]> => {
    await assertAdmin(context.supabase as unknown as ReturnType<typeof serverAnonClient>, context.userId);
    const { data, error } = await context.supabase
      .from("sample_dataset_audit")
      .select("id, actor_id, actor_email, source, action, details, ip_address, user_agent, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as AuditEntry[];
  });

// ------- preview -------

type ExpectedField = { key: string; label: string; required: boolean; aliases: string[]; type?: "email" | "url" };

const EXPECTED: Record<SourceKey, ExpectedField[]> = {
  apollo: [
    { key: "first_name", label: "First Name", required: true, aliases: ["first name", "firstname", "given name"] },
    { key: "last_name", label: "Last Name", required: true, aliases: ["last name", "lastname", "surname", "family name"] },
    { key: "email", label: "Email", required: true, aliases: ["email", "work email", "email address"], type: "email" },
    { key: "title", label: "Title", required: false, aliases: ["title", "job title", "position"] },
    { key: "company", label: "Company", required: true, aliases: ["company", "company name", "organization", "employer"] },
    { key: "website", label: "Company Website", required: false, aliases: ["website", "company website", "domain", "url"], type: "url" },
    { key: "linkedin", label: "LinkedIn URL", required: false, aliases: ["linkedin", "linkedin url", "person linkedin url"], type: "url" },
  ],
  linkedin: [
    { key: "first_name", label: "First Name", required: true, aliases: ["first name", "firstname"] },
    { key: "last_name", label: "Last Name", required: true, aliases: ["last name", "lastname"] },
    { key: "title", label: "Title", required: true, aliases: ["title", "job title", "position"] },
    { key: "company", label: "Company", required: true, aliases: ["company", "current company", "organization"] },
    { key: "location", label: "Location", required: false, aliases: ["location", "geo", "city"] },
    { key: "profile_url", label: "Profile URL", required: false, aliases: ["profile url", "linkedin url", "url"], type: "url" },
  ],
  zoominfo: [
    { key: "first_name", label: "First Name", required: true, aliases: ["first name", "firstname"] },
    { key: "last_name", label: "Last Name", required: true, aliases: ["last name", "lastname"] },
    { key: "email", label: "Email", required: true, aliases: ["email", "email address"], type: "email" },
    { key: "title", label: "Job Title", required: false, aliases: ["job title", "title"] },
    { key: "company", label: "Company", required: true, aliases: ["company", "company name"] },
    { key: "website", label: "Website", required: false, aliases: ["website", "company website", "domain"], type: "url" },
  ],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^(https?:\/\/|www\.)[^\s]+$/i;

export type FieldMapping = {
  key: string;
  label: string;
  required: boolean;
  matched_header: string | null;
  invalid_count: number;
  empty_count: number;
};

export type PreviewResult = {
  headers: string[];
  row_count: number;
  sample_rows: Record<string, string | number | boolean>[];
  unmapped_headers: string[];
  mapping: FieldMapping[];
  errors: { level: "error" | "warn"; message: string }[];
  duplicate_email_count: number;
  empty_row_count: number;
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[_\-.]/g, " ").replace(/\s+/g, " ").trim();
}

function buildPreview(source: SourceKey, parsed: ParsedCsv): PreviewResult {
  const expected = EXPECTED[source];
  const normalizedHeaders = parsed.headers.map(normalizeHeader);
  const usedHeaderIdx = new Set<number>();
  const mapping: FieldMapping[] = expected.map((f) => {
    let matchedIdx = -1;
    for (const alias of [f.label.toLowerCase(), ...f.aliases]) {
      const na = normalizeHeader(alias);
      const idx = normalizedHeaders.findIndex((h, i) => h === na && !usedHeaderIdx.has(i));
      if (idx !== -1) { matchedIdx = idx; break; }
    }
    if (matchedIdx === -1) {
      // fuzzy contains
      for (const alias of f.aliases) {
        const na = normalizeHeader(alias);
        const idx = normalizedHeaders.findIndex((h, i) => !usedHeaderIdx.has(i) && (h.includes(na) || na.includes(h)));
        if (idx !== -1) { matchedIdx = idx; break; }
      }
    }
    if (matchedIdx !== -1) usedHeaderIdx.add(matchedIdx);
    const matched_header = matchedIdx === -1 ? null : parsed.headers[matchedIdx];
    let invalid = 0;
    let empty = 0;
    if (matched_header) {
      for (const row of parsed.rows) {
        const v = String(row[matched_header] ?? "").trim();
        if (!v) { empty++; continue; }
        if (f.type === "email" && !EMAIL_RE.test(v)) invalid++;
        else if (f.type === "url" && !URL_RE.test(v)) invalid++;
      }
    }
    return {
      key: f.key,
      label: f.label,
      required: f.required,
      matched_header,
      invalid_count: invalid,
      empty_count: empty,
    };
  });

  const unmapped_headers = parsed.headers.filter((_, i) => !usedHeaderIdx.has(i));

  // Empty rows: every field blank
  let empty_row_count = 0;
  for (const row of parsed.rows) {
    if (parsed.headers.every((h) => !String(row[h] ?? "").trim())) empty_row_count++;
  }

  // Duplicate emails
  const emailField = mapping.find((m) => m.key === "email" && m.matched_header);
  let duplicate_email_count = 0;
  if (emailField?.matched_header) {
    const seen = new Map<string, number>();
    for (const row of parsed.rows) {
      const e = String(row[emailField.matched_header] ?? "").trim().toLowerCase();
      if (!e) continue;
      seen.set(e, (seen.get(e) ?? 0) + 1);
    }
    for (const n of seen.values()) if (n > 1) duplicate_email_count += n - 1;
  }

  const errors: PreviewResult["errors"] = [];
  if (parsed.headers.length === 0) errors.push({ level: "error", message: "No headers detected — file may not be a CSV." });
  if (parsed.rows.length === 0) errors.push({ level: "error", message: "No data rows found." });
  for (const m of mapping) {
    if (m.required && !m.matched_header) {
      errors.push({ level: "error", message: `Required field "${m.label}" is not mapped to any CSV column.` });
    }
    if (m.matched_header && m.required && m.empty_count > 0) {
      errors.push({ level: "warn", message: `"${m.label}" is empty in ${m.empty_count} row(s).` });
    }
    if (m.matched_header && m.invalid_count > 0) {
      errors.push({ level: "warn", message: `"${m.label}" has ${m.invalid_count} row(s) with an invalid format.` });
    }
  }
  if (duplicate_email_count > 0) {
    errors.push({ level: "warn", message: `Found ${duplicate_email_count} duplicate email row(s).` });
  }
  if (empty_row_count > 0) {
    errors.push({ level: "warn", message: `${empty_row_count} completely empty row(s) will be ignored.` });
  }

  return {
    headers: parsed.headers,
    row_count: parsed.rows.length,
    sample_rows: parsed.rows.slice(0, 5),
    unmapped_headers,
    mapping,
    errors,
    duplicate_email_count,
    empty_row_count,
  };
}

const previewSchema = z.object({
  source: z.enum(["apollo", "linkedin", "zoominfo"]),
  mode: z.enum(["current", "gdrive", "upload"]),
  gdrive_url: z.string().trim().max(500).optional(),
  contentBase64: z.string().optional(),
});

export const adminPreviewSampleDataset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => previewSchema.parse(data))
  .handler(async ({ data, context }): Promise<PreviewResult> => {
    await assertAdmin(context.supabase as unknown as ReturnType<typeof serverAnonClient>, context.userId);
    let parsed: ParsedCsv;
    if (data.mode === "gdrive") {
      if (!data.gdrive_url) throw new Error("gdrive_url required");
      parsed = await fetchAndParse(gdriveDirectUrl(data.gdrive_url));
    } else if (data.mode === "upload") {
      if (!data.contentBase64) throw new Error("contentBase64 required");
      const text = Buffer.from(data.contentBase64, "base64").toString("utf8");
      parsed = parseCsv(text);
    } else {
      const { data: rows, error } = await context.supabase
        .from("sample_datasets")
        .select("source, source_type, gdrive_url, storage_path, display_name, row_count_hint, updated_at")
        .eq("source", data.source)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!rows) parsed = BUILTIN[data.source];
      else {
        const loaded = await loadForSource(rows as SampleDatasetConfig);
        parsed = loaded.parsed;
      }
    }
    return buildPreview(data.source, parsed);
  });
