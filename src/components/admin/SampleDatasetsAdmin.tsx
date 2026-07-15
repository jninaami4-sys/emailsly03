import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Save, Upload, Database } from "@/components/admin/AdminIcons";
import {
  adminListSampleDatasets,
  adminUpsertSampleDataset,
  adminUploadSampleCsv,
  type SampleDatasetConfig,
} from "@/lib/sample-datasets.functions";

type Draft = {
  source_type: SampleDatasetConfig["source_type"];
  gdrive_url: string;
  storage_path: string | null;
  display_name: string;
};

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

export function SampleDatasetsAdmin() {
  const listFn = useServerFn(adminListSampleDatasets);
  const upsertFn = useServerFn(adminUpsertSampleDataset);
  const uploadFn = useServerFn(adminUploadSampleCsv);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-sample-datasets"],
    queryFn: () => listFn(),
    staleTime: 10_000,
  });

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
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

  const upload = async (source: string, file: File) => {
    setUploading(source);
    setStatus(null);
    try {
      const buf = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      const contentBase64 = btoa(binary);
      await uploadFn({
        data: {
          source: source as "apollo" | "linkedin" | "zoominfo",
          filename: file.name,
          contentBase64,
        },
      });
      setStatus(`Uploaded ${file.name}`);
      await refetch();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Upload failed");
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
                      <span className="mb-1 block text-muted-foreground">Upload a new CSV</span>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">
                          {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                          {isUploading ? "Uploading…" : "Choose file"}
                          <input
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) void upload(row.source, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        {d.storage_path && (
                          <span className="truncate font-mono text-[10px] text-muted-foreground">
                            {d.storage_path.split("/").pop()}
                          </span>
                        )}
                      </div>
                    </label>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => save(row.source)}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Save
                  </button>
                </div>
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
