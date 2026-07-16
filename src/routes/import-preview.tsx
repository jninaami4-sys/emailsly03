import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/import-preview")({
  head: () => ({
    meta: [
      { title: "Import preview — review columns before saving" },
      { name: "description", content: "Preview the columns and rows of a CSV or Excel file before importing anything into your account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ImportPreviewPage,
});

type Parsed = {
  fileName: string;
  sheetName?: string;
  columns: string[];
  rows: Record<string, string>[];
  totalRows: number;
};

const MAX_PREVIEW_ROWS = 100;

function parseCsv(text: string): { columns: string[]; rows: string[][] } {
  const out: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = ""; out.push(row); row = [];
      } else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); out.push(row); }
  const header = out.shift() ?? [];
  return { columns: header.map((h) => h.trim()), rows: out.filter((r) => r.some((v) => v !== "")) };
}

async function parseFile(file: File): Promise<Parsed> {
  const isCsv = /\.csv$/i.test(file.name);
  if (isCsv) {
    const text = await file.text();
    const { columns, rows } = parseCsv(text);
    const mapped = rows.map((r) => Object.fromEntries(columns.map((c, i) => [c || `col_${i + 1}`, r[i] ?? ""])));
    return { fileName: file.name, columns: columns.map((c, i) => c || `col_${i + 1}`), rows: mapped.slice(0, MAX_PREVIEW_ROWS), totalRows: mapped.length };
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "", raw: false });
  const columns = json.length ? Object.keys(json[0]) : [];
  const rows = json.map((r) => Object.fromEntries(columns.map((c) => [c, String(r[c] ?? "")])));
  return { fileName: file.name, sheetName, columns, rows: rows.slice(0, MAX_PREVIEW_ROWS), totalRows: rows.length };
}

function ImportPreviewPage() {
  const [data, setData] = useState<Parsed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const columnStats = useMemo(() => {
    if (!data) return [];
    return data.columns.map((c) => {
      const values = data.rows.map((r) => r[c]).filter((v) => v !== "" && v != null);
      const filled = values.length;
      const sample = values.slice(0, 3).join(" · ");
      const numeric = values.length > 0 && values.every((v) => !isNaN(Number(v)));
      return { name: c, filled, total: data.rows.length, sample, type: numeric ? "number" : "text" };
    });
  }, [data]);

  async function handleFile(file: File) {
    setError(null); setBusy(true);
    try {
      const parsed = await parseFile(file);
      setData(parsed);
      setSelected(new Set(parsed.columns));
    } catch (e) {
      setError((e as Error).message || "Could not parse file");
    } finally {
      setBusy(false);
    }
  }

  function toggleCol(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold">Preview import</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Drop a CSV or Excel file to review the columns and first {MAX_PREVIEW_ROWS} rows. Nothing is uploaded or saved — this is a local preview only.
        </p>
      </header>

      {!data && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            const f = e.dataTransfer.files?.[0]; if (f) void handleFile(f);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 text-center transition ${dragOver ? "border-violet bg-violet/5" : "border-border hover:border-violet/50"}`}
        >
          <UploadCloud className="size-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Drop a file or click to browse</p>
          <p className="text-xs text-muted-foreground">.csv, .xlsx, .xls</p>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
          />
          {busy && <p className="mt-3 text-xs text-muted-foreground">Parsing…</p>}
          {error && (
            <p className="mt-3 inline-flex items-center gap-1 text-xs text-red-500">
              <AlertTriangle className="size-3.5" /> {error}
            </p>
          )}
        </label>
      )}

      {data && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="size-5 text-violet" />
              <div>
                <p className="font-semibold">{data.fileName}{data.sheetName ? ` — ${data.sheetName}` : ""}</p>
                <p className="text-xs text-muted-foreground">
                  {data.columns.length} columns · {data.totalRows.toLocaleString()} rows · showing first {data.rows.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald/10 px-2.5 py-1 text-[11px] font-semibold text-emerald">
                <CheckCircle2 className="size-3" /> {selected.size} selected
              </span>
              <button
                onClick={() => { setData(null); setError(null); setSelected(new Set()); }}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                <X className="size-3.5" /> Clear
              </button>
            </div>
          </div>

          <section className="mb-4 rounded-xl border border-border bg-card">
            <header className="border-b border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Columns detected
            </header>
            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {columnStats.map((c) => {
                const on = selected.has(c.name);
                return (
                  <button
                    key={c.name}
                    onClick={() => toggleCol(c.name)}
                    className={`rounded-lg border p-3 text-left transition ${on ? "border-violet bg-violet/5" : "border-border bg-background hover:border-violet/40"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-mono text-xs font-semibold">{c.name}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase">{c.type}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{c.sample || "—"}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{c.filled}/{c.total} filled</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b border-border">
                    <th className="w-10 px-3 py-2 text-xs font-bold text-muted-foreground">#</th>
                    {data.columns.filter((c) => selected.has(c)).map((c) => (
                      <th key={c} className="px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((r, i) => (
                    <tr key={i} className={i % 2 ? "bg-card" : "bg-background"}>
                      <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                      {data.columns.filter((c) => selected.has(c)).map((c) => (
                        <td key={c} className="max-w-[280px] truncate px-3 py-2 text-sm">{r[c]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="mt-3 text-xs text-muted-foreground">
            Preview only. Nothing has been saved. Pick which columns to keep, then wire up a "Save" step when you're ready.
          </p>
        </>
      )}
    </main>
  );
}
