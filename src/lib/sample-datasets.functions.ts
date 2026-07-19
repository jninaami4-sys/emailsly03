/**
 * Sample datasets — thin proxies to PHP API. All CSV parsing, GDrive fetching,
 * audit and preview logic now lives server-side (PHP). (Batch 6 migration).
 */
import { sampleDatasetsApi, adminSampleDatasetsApi } from "@/lib/api-client";

export type SourceKey = "apollo" | "linkedin" | "zoominfo";

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
  meta: Record<
    SourceKey,
    {
      source_type: "builtin" | "gdrive" | "upload";
      display_name: string;
      updated_at: string;
      row_count: number;
      error: string | null;
    }
  >;
  totalRows: number;
};

type JsonValue = string | number | boolean | null | { [k: string]: JsonValue } | JsonValue[];

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

type Empty = Record<string, never>;

/* -------- public -------- */
export async function getSampleDatasets(_?: { data?: Empty }): Promise<SampleDatasetsPayload> {
  try {
    const res = await sampleDatasetsApi.get();
    const payload = res as SampleDatasetsPayload;
    const anyRows =
      (payload?.totalRows ?? 0) > 0 ||
      Object.values(payload?.data ?? {}).some((d) => (d?.rows?.length ?? 0) > 0);
    if (!anyRows) return await buildFallbackPayload();
    return payload;
  } catch {
    return await buildFallbackPayload();
  }
}

async function buildFallbackPayload(): Promise<SampleDatasetsPayload> {
  const mod = await import("./sample-apollo-leads");
  const leads = mod.default;
  const headers = [
    "First Name",
    "Last Name",
    "Title",
    "Company",
    "Email",
    "Email Status",
    "City",
    "State",
    "Country",
    "Industry",
    "Employees",
    "LinkedIn URL",
    "Website",
  ];
  const rows: Record<string, string | number | boolean>[] = leads.map((l) => {
    const [first, ...rest] = (l.name || "").split(" ");
    return {
      "First Name": first ?? "",
      "Last Name": rest.join(" "),
      Title: l.title ?? "",
      Company: l.company ?? "",
      Email: l.email ?? "",
      "Email Status": l.status ?? "",
      City: l.city ?? "",
      State: l.state ?? "",
      Country: l.country ?? "",
      Industry: l.industry ?? "",
      Employees: l.employees ?? 0,
      "LinkedIn URL": l.linkedinUrl ?? "",
      Website: l.website ?? "",
    };
  });
  const csv = { headers, rows };
  const now = new Date().toISOString();
  const meta = (name: string) => ({
    source_type: "builtin" as const,
    display_name: name,
    updated_at: now,
    row_count: rows.length,
    error: null,
  });
  return {
    data: { apollo: csv, linkedin: csv, zoominfo: csv },
    meta: {
      apollo: meta("Apollo · Verified B2B leads"),
      linkedin: meta("LinkedIn Sales Navigator · Decision makers"),
      zoominfo: meta("ZoomInfo · Enriched contacts"),
    },
    totalRows: rows.length * 3,
  };
}

/* -------- admin -------- */
export async function adminListSampleDatasets(_?: {
  data?: Empty;
}): Promise<SampleDatasetConfig[]> {
  const { datasets } = await adminSampleDatasetsApi.list();
  return (datasets ?? []) as SampleDatasetConfig[];
}

export async function adminUpsertSampleDataset(args: {
  data: {
    source: SourceKey;
    source_type: "builtin" | "gdrive" | "upload";
    gdrive_url?: string | null;
    storage_path?: string | null;
    display_name: string;
  };
}): Promise<{ ok: true }> {
  await adminSampleDatasetsApi.upsert(args.data);
  return { ok: true };
}

export async function adminUploadSampleCsv(args: {
  data: { source: SourceKey; filename: string; contentBase64: string };
}): Promise<{ ok: true; storage_path: string }> {
  return adminSampleDatasetsApi.upload(args.data);
}

export async function adminListSampleDatasetAudit(_?: {
  data?: Empty;
}): Promise<AuditEntry[]> {
  const { entries } = await adminSampleDatasetsApi.audit();
  return (entries ?? []) as AuditEntry[];
}

export async function adminPreviewSampleDataset(args: {
  data: {
    source: SourceKey;
    mode: "current" | "gdrive" | "upload";
    gdrive_url?: string;
    contentBase64?: string;
  };
}): Promise<PreviewResult> {
  const { preview } = await adminSampleDatasetsApi.preview(args.data);
  return preview as PreviewResult;
}
