import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Save, Upload, Database } from "@/components/admin/AdminIcons";
import {
  adminListSampleDatasets,
  adminUpsertSampleDataset,
  adminUploadSampleCsv,
  adminPreviewSampleDataset,
  type SampleDatasetConfig,
  type PreviewResult,
} from "@/lib/sample-datasets.functions";

type Draft = {
  source_type: SampleDatasetConfig["source_type"];
  gdrive_url: string;
  storage_path: string | null;
  display_name: string;
};

type PendingUpload = { filename: string; contentBase64: string } | null;

function toDraft(c: SampleDatasetConfig): Draft {
  return {
    source_type: c.source_type,
    gdrive_url: c.gdrive_url ?? "",
    storage_path: c.storage_path,
    display_name: c.display_name,
  };
}

const HELP: Record<string, string> = {
  apollo: "Apollo export CSV (First Name, Last Name, Email, Title…).",
  linkedin: "LinkedIn Sales Navigator export CSV.",
  zoominfo: "ZoomInfo contacts export CSV.",
};

async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function SampleDatasetsAdmin() {
  const listFn = useServerFn(adminListSampleDatasets);
  const upsertFn = useServerFn(adminUpsertSampleDataset);
  const uploadFn = useServerFn(adminUploadSampleCsv);
  const previewFn = useServerFn(adminPreviewSampleDataset);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-sample-datasets"],
    queryFn: () => listFn(),
    staleTime: 10_000,
  });

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [pendingUpload, setPendingUpload] = useState<Record<string, PendingUpload>>({});
  const [preview, setPreview] = useState<Record<string, PreviewResult | null>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    const next: Record<string, Draft> = {};
    for (const row of data) next[row.source] = toDraft(row);
    setDrafts(next);
  }, [data]);

  const save = async (source: string) => {
    const d = drafts[source];
    if (!d) return;
    setSaving(source);
    setStatus(null);
    try {
      await upsertFn({
        data: {
          source: source as "apollo" | "linkedin" | "zoominfo",
          source_type: d.source_type,
          gdrive_url: d.source_type === "gdrive" ? d.gdrive_url : null,
          storage_path: d.source_type === "upload" ? d.storage_path : null,
          display_name: d.display_name,
        },
      });
      setStatus(`Saved ${source}`);
      await refetch();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(null);
    }
  };

  const runPreview = async (source: string, mode: "current" | "gdrive" | "upload") => {
    setPreviewing(source);
    setStatus(null);
    try {
      const d = drafts[source];
      const pending = pendingUpload[source];
      const result = await previewFn({
        data: {
          source: source as "apollo" | "linkedin" | "zoominfo",
          mode,
          gdrive_url: mode === "gdrive" ? d?.gdrive_url : undefined,
          contentBase64: mode === "upload" ? pending?.contentBase64 : undefined,
        },
      });
      setPreview((p) => ({ ...p, [source]: result }));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewing(null);
    }
  };

  const stagePendingFile = async (source: string, file: File) => {
    setStatus(null);
    setPreviewing(source);
    try {
      const contentBase64 = await fileToBase64(file);
      setPendingUpload((p) => ({ ...p, [source]: { filename: file.name, contentBase64 } }));
      const result = await previewFn({
        data: {
          source: source as "apollo" | "linkedin" | "zoominfo",
          mode: "upload",
          contentBase64,
        },
      });
      setPreview((p) => ({ ...p, [source]: result }));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Preview failed");
    } finally {
      setPreviewing(null);
    }
  };

  const applyPendingUpload = async (source: string) => {
    const pending = pendingUpload[source];
    if (!pending) return;
    setUploading(source);
    setStatus(null);
    try {
      await uploadFn({
        data: {
          source: source as "apollo" | "linkedin" | "zoominfo",
          filename: pending.filename,
          contentBase64: pending.contentBase64,
        },
      });
      setStatus(`Applied ${pending.filename}`);
      setPendingUpload((p) => ({ ...p, [source]: null }));
      setPreview((p) => ({ ...p, [source]: null }));
      await refetch();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Apply failed");
    } finally {
      setUploading(null);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <Database className="size-4" /> Sample datasets
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Feed the /sample-data page from a Google Drive CSV, an uploaded CSV, or the built-in seed file.
            Preview any change before you apply it.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
        >
          <RefreshCw className={isFetching ? "size-3.5 animate-spin" : "size-3.5"} /> Refresh
        </button>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-4">
          {(data ?? []).map((row) => {
            const d = drafts[row.source];
            if (!d) return null;
            const isSaving = saving === row.source;
            const isUploading = uploading === row.source;
            const isPreviewing = previewing === row.source;
            const pending = pendingUpload[row.source];
            const pv = preview[row.source];
            return (
              <div key={row.source} className="rounded-xl border border-border bg-background/40 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{row.source}</div>
                    <div className="font-display text-base font-bold">{d.display_name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{HELP[row.source]}</div>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground">
                    <div>Current: <span className="font-mono">{row.source_type}</span></div>
                    <div>Updated: {new Date(row.updated_at).toLocaleString()}</div>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  {(["builtin", "gdrive", "upload"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setDrafts((p) => ({ ...p, [row.source]: { ...d, source_type: t } }))}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                        d.source_type === t
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t === "builtin" ? "Built-in seed" : t === "gdrive" ? "Google Drive URL" : "Upload CSV"}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs">
                    <span className="mb-1 block text-muted-foreground">Display name</span>
                    <input
                      value={d.display_name}
                      onChange={(e) => setDrafts((p) => ({ ...p, [row.source]: { ...d, display_name: e.target.value } }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  {d.source_type === "gdrive" && (
                    <label className="text-xs">
                      <span className="mb-1 block text-muted-foreground">
                        Google Drive share URL (anyone with the link can view)
                      </span>
                      <input
                        value={d.gdrive_url}
                        onChange={(e) => setDrafts((p) => ({ ...p, [row.source]: { ...d, gdrive_url: e.target.value } }))}
                        placeholder="https://drive.google.com/file/d/…/view"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
                      />
                    </label>
                  )}
                  {d.source_type === "upload" && (
                    <label className="text-xs">
                      <span className="mb-1 block text-muted-foreground">Upload a new CSV (previews before apply)</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">
                          {isPreviewing ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                          {isPreviewing ? "Reading…" : pending ? "Choose different file" : "Choose file"}
                          <input
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void stagePendingFile(row.source, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        {pending && (
                          <span className="truncate font-mono text-[10px] text-muted-foreground">
                            staged: {pending.filename}
                          </span>
                        )}
                        {!pending && d.storage_path && (
                          <span className="truncate font-mono text-[10px] text-muted-foreground">
                            current: {d.storage_path.split("/").pop()}
                          </span>
                        )}
                      </div>
                    </label>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                  <button
                    onClick={() =>
                      runPreview(
                        row.source,
                        d.source_type === "gdrive" ? "gdrive" : d.source_type === "upload" && pending ? "upload" : "current",
                      )
                    }
                    disabled={isPreviewing || (d.source_type === "gdrive" && !d.gdrive_url)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-60"
                  >
                    {isPreviewing ? <Loader2 className="size-3.5 animate-spin" /> : <Database className="size-3.5" />}
                    Preview
                  </button>
                  {d.source_type === "upload" && pending && (
                    <button
                      onClick={() => applyPendingUpload(row.source)}
                      disabled={isUploading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/90 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-60"
                    >
                      {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                      Apply upload
                    </button>
                  )}
                  <button
                    onClick={() => save(row.source)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Save config
                  </button>
                </div>

                {pv && <PreviewPanel source={row.source} pv={pv} onClose={() => setPreview((p) => ({ ...p, [row.source]: null }))} />}
              </div>
            );
          })}
        </div>
      )}

      {status && (
        <div className="mt-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs">
          {status}
        </div>
      )}
    </section>
  );
}

function PreviewPanel({
  source,
  pv,
  onClose,
}: {
  source: string;
  pv: PreviewResult;
  onClose: () => void;
}) {
  const errors = pv.errors.filter((e) => e.level === "error");
  const warnings = pv.errors.filter((e) => e.level === "warn");
  const hasBlockers = errors.length > 0;

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-border bg-background/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Preview · {source}</div>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-3 text-sm">
            <span className="font-display text-2xl font-bold">{pv.row_count.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">rows · {pv.headers.length} columns</span>
            {pv.empty_row_count > 0 && (
              <span className="text-xs text-amber-500">{pv.empty_row_count} empty</span>
            )}
            {pv.duplicate_email_count > 0 && (
              <span className="text-xs text-amber-500">{pv.duplicate_email_count} duplicate emails</span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg border border-border px-2 py-1 text-[10px] font-semibold hover:bg-muted">
          Close preview
        </button>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Field mapping</div>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Expected</th>
                <th className="px-3 py-2">Matched CSV column</th>
                <th className="px-3 py-2 text-right">Empty</th>
                <th className="px-3 py-2 text-right">Invalid</th>
              </tr>
            </thead>
            <tbody>
              {pv.mapping.map((m) => (
                <tr key={m.key} className="border-t border-border">
                  <td className="px-3 py-2">
                    {m.label}
                    {m.required && <span className="ml-1 text-red-500">*</span>}
                  </td>
                  <td className="px-3 py-2 font-mono">
                    {m.matched_header ? (
                      <span className="text-foreground">{m.matched_header}</span>
                    ) : (
                      <span className={m.required ? "text-red-500" : "text-muted-foreground"}>— not mapped —</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {m.matched_header ? (m.empty_count > 0 ? <span className="text-amber-500">{m.empty_count}</span> : "0") : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {m.matched_header ? (m.invalid_count > 0 ? <span className="text-red-500">{m.invalid_count}</span> : "0") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pv.unmapped_headers.length > 0 && (
          <div className="mt-2 text-[11px] text-muted-foreground">
            Extra CSV columns (ignored): <span className="font-mono">{pv.unmapped_headers.join(", ")}</span>
          </div>
        )}
      </div>

      {(errors.length > 0 || warnings.length > 0) && (
        <div className="space-y-1.5">
          {errors.map((e, i) => (
            <div key={`e${i}`} className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {e.message}
            </div>
          ))}
          {warnings.map((w, i) => (
            <div key={`w${i}`} className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
              {w.message}
            </div>
          ))}
        </div>
      )}

      {pv.sample_rows.length > 0 && (
        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Sample rows (first {pv.sample_rows.length})
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-[11px]">
              <thead className="bg-muted/50 text-left text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  {pv.headers.slice(0, 8).map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2">{h}</th>
                  ))}
                  {pv.headers.length > 8 && <th className="px-3 py-2">…</th>}
                </tr>
              </thead>
              <tbody>
                {pv.sample_rows.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    {pv.headers.slice(0, 8).map((h) => (
                      <td key={h} className="max-w-[180px] truncate px-3 py-1.5 font-mono text-muted-foreground">
                        {String(r[h] ?? "")}
                      </td>
                    ))}
                    {pv.headers.length > 8 && <td className="px-3 py-1.5 text-muted-foreground">…</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {hasBlockers && (
        <div className="text-[11px] text-red-400">
          Resolve required-field errors before applying — the /sample-data page needs these columns.
        </div>
      )}
    </div>
  );
}
