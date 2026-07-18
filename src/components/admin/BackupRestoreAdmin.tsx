import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { exportBackup, restoreBackup } from "@/lib/admin-extras.functions";
import { Loader2, Upload, Database } from "@/components/admin/AdminIcons";

export function BackupRestoreAdmin() {
  const exportFn = useServerFn(exportBackup);
  const restoreFn = useServerFn(restoreBackup);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [result, setResult] = useState<any | null>(null);

  const exp = useMutation({
    mutationFn: () => exportFn(),
    onSuccess: (b) => {
      const blob = new Blob([JSON.stringify(b, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `emailsly-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
  });

  const res = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const backup = JSON.parse(text);
      return restoreFn({ data: { backup, mode } });
    },
    onSuccess: (r) => setResult(r),
    onError: (e) => setResult({ error: (e as Error).message }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Database className="size-5 text-primary" />
          <h3 className="font-display text-lg font-black">Backup</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Download a JSON snapshot of settings, content, blog, pricing, offers, telegram bots, and campaigns. Orders and user data are excluded.
        </p>
        <button
          onClick={() => exp.mutate()}
          disabled={exp.isPending}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {exp.isPending ? <Loader2 className="size-4 animate-spin" /> : <Database className="size-4" />}
          Download backup
        </button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Upload className="size-5 text-primary" />
          <h3 className="font-display text-lg font-black">Restore</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Upload a previously exported JSON file. Merge upserts rows; Replace wipes each table first.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold">
            <option value="merge">Merge (upsert)</option>
            <option value="replace">Replace (destructive)</option>
          </select>
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                if (mode === "replace" && !confirm("Replace mode wipes the tables listed in the backup. Continue?")) return;
                res.mutate(f);
              }
            }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={res.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold disabled:opacity-50"
          >
            {res.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Upload JSON
          </button>
        </div>
        {result && (
          <pre className="mt-4 max-h-64 overflow-auto rounded-lg border border-border bg-secondary p-3 font-mono text-[11px]">{JSON.stringify(result, null, 2)}</pre>
        )}
      </section>
    </div>
  );
}
