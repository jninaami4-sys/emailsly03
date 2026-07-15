import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { getMyOrder } from "@/lib/orders.functions";
import { Loader2, Printer, Download } from "lucide-react";
import emailslyLogo from "@/assets/emailsly-logo-trim.png.asset.json";

const BRAND = {
  violet: "#7C3AED",
  violetSoft: "#A78BFA",
  ink: "#0A0A1F",
  paper: "#FAFAFC",
  border: "#E5E7EB",
  muted: "#6B7280",
} as const;

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
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!invoiceRef.current || downloading) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, jspdfMod] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const jsPDF = (jspdfMod as any).jsPDF ?? (jspdfMod as any).default;
      const el = invoiceRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`invoice-${orderId.slice(0, 8).toUpperCase()}.pdf`);
    } catch (err) {
      console.error("Invoice download failed", err);
      window.print();
    } finally {
      setDownloading(false);
    }
  }

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
        <div className="mb-4 flex justify-end gap-2 print:hidden">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: BRAND.violet }}
          >
            {downloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {downloading ? "Preparing…" : "Download PDF"}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            <Printer className="size-4" /> Print
          </button>
        </div>
        <div
          ref={invoiceRef}
          className="rounded-2xl border bg-white p-8 text-black print:border-0 print:shadow-none"
          style={{ borderColor: BRAND.border, color: BRAND.ink }}
        >
          {/* Accent bar */}
          <div
            className="mb-6 h-1.5 w-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${BRAND.violet}, ${BRAND.violetSoft})` }}
          />

          {/* Brand header */}
          <div
            className="mb-6 flex items-start justify-between border-b pb-5"
            style={{ borderColor: BRAND.border }}
          >
            <div className="flex items-center gap-3">
              <img
                src={emailslyLogo.url}
                alt="EmailsLy"
                crossOrigin="anonymous"
                className="h-9 w-auto"
              />
              <div
                className="ml-1 hidden border-l pl-3 text-[11px] sm:block"
                style={{ borderColor: BRAND.border, color: BRAND.muted }}
              >
                Lead generation &amp; outbound data
              </div>
            </div>
            <div className="text-right text-[11px]" style={{ color: BRAND.muted }}>
              <div>hello@emailsly.com</div>
              <div>emailsly.com</div>
              <div>1007 N Orange St, 4th Floor</div>
              <div>Wilmington, DE 19801, USA</div>
            </div>
          </div>

          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1
                className="font-display text-2xl font-bold"
                style={{ color: BRAND.violet }}
              >
                Invoice
              </h1>
              <p className="text-xs" style={{ color: BRAND.muted }}>#{o.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right text-xs" style={{ color: BRAND.muted }}>
              <div>Date: {new Date(o.created_at).toLocaleDateString()}</div>
              <div>Status: {o.status}</div>
              <div>Payment: {o.payment_status}</div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Billed to</div>
              <div className="mt-1 font-semibold">{o.email}</div>
            </div>
            <div className="sm:text-right">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">From</div>
              <div className="mt-1 font-semibold">EmailsLy</div>
              <div className="text-xs text-neutral-600">billing@emailsly.com</div>
            </div>
          </div>

          <table className="mb-6 w-full text-sm">
            <thead className="border-b border-neutral-300">
              <tr className="text-left">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-200">
                <td className="py-2">{o.service_label}</td>
                <td className="py-2 text-right">{o.quantity}</td>
                <td className="py-2 text-right font-mono">{money(o.subtotal_cents, o.currency)}</td>
              </tr>
              {o.discount_cents > 0 && (
                <tr className="border-b border-neutral-200">
                  <td className="py-2 text-neutral-500">Discount {o.promo_code ? `(${o.promo_code})` : ""}</td>
                  <td />
                  <td className="py-2 text-right font-mono text-emerald-600">−{money(o.discount_cents, o.currency)}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td
                  colSpan={2}
                  className="pt-3 text-right font-semibold uppercase tracking-wider"
                  style={{ color: BRAND.violet }}
                >
                  Total
                </td>
                <td
                  className="pt-3 text-right font-mono text-lg font-bold"
                  style={{ color: BRAND.violet }}
                >
                  {money(o.total_cents, o.currency)}
                </td>
              </tr>
            </tfoot>
          </table>

          {o.payment_ref && (
            <p className="text-xs text-neutral-500">Payment reference: {o.payment_ref}</p>
          )}

          {/* Footer notes */}
          <div className="mt-10 border-t border-neutral-200 pt-4 text-[11px] leading-relaxed text-neutral-500">
            <p className="font-semibold text-neutral-700">Thank you for choosing EmailsLy.</p>
            <p className="mt-1">
              Payment is due upon receipt. All sales of digital lead data are final and non-refundable
              once delivered, per our refund policy at emailsly.com/refund-policy.
            </p>
            <p className="mt-1">
              Questions about this invoice? Email billing@emailsly.com and quote invoice
              #{o.id.slice(0, 8).toUpperCase()}.
            </p>
            <p className="mt-3 text-center text-neutral-400">
              EmailsLy · 1007 N Orange St, 4th Floor, Wilmington, DE 19801, USA · emailsly.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
