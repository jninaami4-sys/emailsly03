import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { importClientsAndOrders, exportAll } from "@/lib/data-portability.functions";
import { Loader2, Upload, Download, Database } from "lucide-react";

const SAMPLE = JSON.stringify(
  {
    source: "old-site-a",
    create_logins: true,
    clients: [
      { email: "client@example.com", full_name: "Client Name", company: "Acme", external_id: "u_123" },
    ],
    orders: [
      {
        email: "client@example.com",
        external_id: "o_456",
        service_label: "LinkedIn leads 5k",
        service_id: "linkedin_5k",
        quantity: 1,
        subtotal_cents: 9900,
        discount_cents: 0,
        total_cents: 9900,
        currency: "USD",
        status: "delivered",
        payment_status: "paid",
        payment_provider: "stripe",
        payment_ref: "pi_xxx",
        delivery_url: "https://drive.google.com/...",
        created_at: "2025-08-01T12:00:00Z",
      },
    ],
  },
  null,
  2,
);

export function ImportExportAdmin() {
  const importFn = useServerFn(importClientsAndOrders);
  const exportFn = useServerFn(exportAll);
  const [json, setJson] = useState(SAMPLE);

  const runImport = useMutation({
    mutationFn: async () => {
      const parsed = JSON.parse(json);
      return importFn({ data: parsed });
    },
  });

  const runExport = useMutation({
    mutationFn: async () => exportFn(),
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Database className="size-4 text-violet" />
        <h2 className="font-display text-xl font-bold">Data portability</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Import clients &amp; orders from your other sites, or export everything as JSON for backup / migration. Imports are idempotent — safe to re-run.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">Import JSON</label>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={14}
            className="w-full rounded-lg border border-border bg-background p-3 font-mono text-[11px]"
          />
          <div className="mt-2 flex items-center gap-2">
            <label className="cursor-pointer rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary">
              Load file
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setJson(await f.text());
                }}
              />
            </label>
            <button
              onClick={() => runImport.mutate()}
              disabled={runImport.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              {runImport.isPending ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
              Run import
            </button>
          </div>
          {runImport.error && (
            <p className="mt-2 text-xs text-rose-500">{(runImport.error as Error).message}</p>
          )}
          {runImport.data && (
            <p className="mt-2 text-xs text-emerald">
              Imported {runImport.data.clients_processed} clients ({runImport.data.users_created} new logins),{" "}
              {runImport.data.orders_upserted} orders.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Export snapshot</label>
          <p className="mb-3 text-xs text-muted-foreground">
            Downloads a JSON file with every profile, order, and event. Keep this alongside the codebase for full portability.
          </p>
          <button
            onClick={() => runExport.mutate()}
            disabled={runExport.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
          >
            {runExport.isPending ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
            Download export.json
          </button>
          {runExport.error && (
            <p className="mt-2 text-xs text-rose-500">{(runExport.error as Error).message}</p>
          )}
        </div>
      </div>
    </section>
  );
}
