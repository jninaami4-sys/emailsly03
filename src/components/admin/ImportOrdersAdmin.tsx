import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { importLegacyOrders } from "@/lib/admin-extras.functions";
import { Loader2, Upload, Users } from "@/components/admin/AdminIcons";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length < 2) return [];
  const parseLine = (line: string) => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = !inQ;
      } else if (c === "," && !inQ) {
        out.push(cur);
        cur = "";
      } else cur += c;
    }
    out.push(cur);
    return out;
  };
  const headers = parseLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    return row;
  });
}

export function ImportOrdersAdmin() {
  const inputRef = useRef<HTMLInputElement>(null);
  const importFn = (importLegacyOrders);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const run = useMutation({
    mutationFn: () => importFn({ data: { rows: preview ?? [] } }),
    onSuccess: (r) => setResult(r),
    onError: (e) => setResult({ error: (e as Error).message }),
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Users className="size-5 text-primary" />
        <h3 className="font-display text-lg font-black">Import legacy orders (CSV)</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Expected columns: <span className="font-mono">email, service_label, quantity, total_cents, currency, status, payment_status, created_at, notes</span>.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const text = await f.text();
            setPreview(parseCsv(text));
            setResult(null);
          }}
        />
        <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold">
          <Upload className="size-4" />
          Choose CSV
        </button>
        {preview && preview.length > 0 && (
          <button
            onClick={() => run.mutate()}
            disabled={run.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {run.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Import {preview.length} row{preview.length === 1 ? "" : "s"}
          </button>
        )}
      </div>

      {preview && preview.length > 0 && (
        <div className="mt-4 max-h-80 overflow-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-secondary">
              <tr>
                {Object.keys(preview[0]).map((h) => (
                  <th key={h} className="px-2 py-1.5 text-left font-mono font-bold uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.slice(0, 50).map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {Object.values(r).map((v, j) => (
                    <td key={j} className="px-2 py-1.5">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 50 && <div className="p-2 text-center text-xs text-muted-foreground">…and {preview.length - 50} more rows</div>}
        </div>
      )}

      {result && <pre className="mt-4 max-h-64 overflow-auto rounded-lg border border-border bg-secondary p-3 font-mono text-[11px]">{JSON.stringify(result, null, 2)}</pre>}
    </section>
  );
}
