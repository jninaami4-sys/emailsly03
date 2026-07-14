import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyOrder } from "@/lib/orders.functions";
import { Loader2, Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/invoice/$orderId")({
  head: () => ({ meta: [{ title: "Invoice" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: InvoicePage,
});

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

function InvoicePage() {
  const { orderId } = Route.useParams();
  const getFn = useServerFn(getMyOrder);
  const { data, isLoading } = useQuery({ queryKey: ["my-order", orderId], queryFn: () => getFn({ data: { id: orderId } }) });

  if (isLoading || !data?.order)
    return (
      <div className="p-10 text-center">
        <Loader2 className="mx-auto size-5 animate-spin" />
      </div>
    );

  const o = data.order;
  return (
    <div className="min-h-screen bg-background p-6 print:p-0">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex justify-end print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-violet px-4 py-2 text-sm font-semibold text-white"
          >
            <Printer className="size-4" /> Print / Save PDF
          </button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 print:border-0 print:shadow-none">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">Invoice</h1>
              <p className="text-xs text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>Date: {new Date(o.created_at).toLocaleDateString()}</div>
              <div>Status: {o.status}</div>
              <div>Payment: {o.payment_status}</div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Billed to</div>
              <div className="mt-1 font-semibold">{o.email}</div>
            </div>
          </div>

          <table className="mb-6 w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2">{o.service_label}</td>
                <td className="py-2 text-right">{o.quantity}</td>
                <td className="py-2 text-right font-mono">{money(o.subtotal_cents, o.currency)}</td>
              </tr>
              {o.discount_cents > 0 && (
                <tr className="border-b border-border">
                  <td className="py-2 text-muted-foreground">Discount {o.promo_code ? `(${o.promo_code})` : ""}</td>
                  <td />
                  <td className="py-2 text-right font-mono text-emerald">−{money(o.discount_cents, o.currency)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="pt-3 text-right font-semibold">
                  Total
                </td>
                <td className="pt-3 text-right font-mono text-lg font-bold">{money(o.total_cents, o.currency)}</td>
              </tr>
            </tfoot>
          </table>

          {o.payment_ref && (
            <p className="text-xs text-muted-foreground">Payment reference: {o.payment_ref}</p>
          )}
        </div>
      </div>
    </div>
  );
}
