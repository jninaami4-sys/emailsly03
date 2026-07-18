import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getMyOrder } from "@/lib/orders.functions";
import { Loader2, Printer, Download, Receipt } from "lucide-react";
import { useSiteContent } from "@/hooks/use-site-content";

const BRAND = {
  primary: [65, 141, 241] as [number, number, number],
  ink: [10, 10, 31] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],
  emerald: [16, 185, 129] as [number, number, number],
};

export const Route = createFileRoute("/_authenticated/invoice/$orderId")({
  head: ({ params }) => ({
    meta: [{ title: "Invoice" }, { name: "robots", content: "noindex,nofollow" }],
    links: [{ rel: "canonical", href: `/invoice/${params.orderId}` }],
  }),
  component: InvoicePage,
});

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format((cents || 0) / 100);
}

function InvoicePage() {
  const { orderId } = Route.useParams();
  const getFn = useServerFn(getMyOrder);
  const { data, isLoading } = useQuery({
    queryKey: ["my-order", orderId],
    queryFn: () => getFn({ data: { id: orderId } }),
  });
  const branding = useSiteContent("branding");
  const brandName = branding.site_name || "EmailsLy";
  const [downloading, setDownloading] = useState<null | "invoice" | "receipt">(null);

  async function buildPdf(variant: "invoice" | "receipt") {
    if (!data?.order || downloading) return;
    setDownloading(variant);
    try {
      const jspdfMod: any = await import("jspdf");
      const jsPDF = jspdfMod.jsPDF ?? jspdfMod.default;
      const o = data.order;
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const margin = 18;
      const isReceipt = variant === "receipt";

      // Accent bar
      doc.setFillColor(...BRAND.primary);
      doc.rect(0, 0, pageW, 6, "F");

      // Header — brand
      doc.setTextColor(...BRAND.ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text(brandName, margin, 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.muted);
      doc.text("Lead generation & outbound data", margin, 27);

      // Right — contact
      const rightX = pageW - margin;
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.muted);
      const contact = [
        "hello@emailsly.com",
        "emailsly.com",
        "House 42, Road 11, Banani",
        "Dhaka 1213, Bangladesh",
      ];
      contact.forEach((line, i) => doc.text(line, rightX, 20 + i * 4.2, { align: "right" }));

      // Divider
      doc.setDrawColor(...BRAND.border);
      doc.setLineWidth(0.3);
      doc.line(margin, 40, pageW - margin, 40);

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.setTextColor(...BRAND.primary);
      doc.text(isReceipt ? "RECEIPT" : "INVOICE", margin, 52);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.muted);
      doc.text(`#${o.id.slice(0, 8).toUpperCase()}`, margin, 58);

      // Meta right
      const paidAt = o.metadata?.paid_at || o.updated_at;
      const metaLines = [
        [`${isReceipt ? "Receipt" : "Invoice"} date:`, new Date(isReceipt ? paidAt : o.created_at).toLocaleDateString()],
        ["Order date:", new Date(o.created_at).toLocaleDateString()],
        ["Status:", String(o.status || "").toUpperCase()],
        ["Payment:", String(o.payment_status || "").toUpperCase()],
      ];
      metaLines.forEach(([k, v], i) => {
        doc.setTextColor(...BRAND.muted);
        doc.text(k, rightX - 34, 50 + i * 5, { align: "left" });
        doc.setTextColor(...BRAND.ink);
        doc.setFont("helvetica", "bold");
        doc.text(String(v), rightX, 50 + i * 5, { align: "right" });
        doc.setFont("helvetica", "normal");
      });

      // Paid stamp
      if (isReceipt && o.payment_status === "paid") {
        doc.setDrawColor(...BRAND.emerald);
        doc.setLineWidth(0.8);
        doc.roundedRect(pageW - margin - 40, 62, 40, 12, 2, 2);
        doc.setTextColor(...BRAND.emerald);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("PAID", pageW - margin - 20, 70.5, { align: "center" });
        doc.setFont("helvetica", "normal");
      }

      // Bill To / From
      let y = 82;
      doc.setFontSize(8);
      doc.setTextColor(...BRAND.muted);
      doc.text("BILLED TO", margin, y);
      doc.text("FROM", rightX, y, { align: "right" });
      y += 5;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...BRAND.ink);
      doc.text(o.email || "-", margin, y);
      doc.text(brandName, rightX, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.muted);
      y += 4.5;
      doc.text("billing@emailsly.com", rightX, y, { align: "right" });

      // Line items table
      y = 108;
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, y, pageW - margin * 2, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.ink);
      doc.text("DESCRIPTION", margin + 3, y + 5.3);
      doc.text("QTY", pageW - margin - 55, y + 5.3, { align: "right" });
      doc.text("RATE", pageW - margin - 28, y + 5.3, { align: "right" });
      doc.text("AMOUNT", pageW - margin - 3, y + 5.3, { align: "right" });
      y += 12;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.ink);
      const qty = Number(o.quantity || 0);
      const sub = Number(o.subtotal_cents || 0);
      const rate = qty > 0 ? sub / qty / 100 : 0;
      doc.text(o.service_label || "Service", margin + 3, y);
      doc.text(qty.toLocaleString(), pageW - margin - 55, y, { align: "right" });
      doc.text(`$${rate.toFixed(4)}`, pageW - margin - 28, y, { align: "right" });
      doc.text(money(sub, o.currency), pageW - margin - 3, y, { align: "right" });
      y += 6;
      doc.setDrawColor(...BRAND.border);
      doc.line(margin, y, pageW - margin, y);
      y += 8;

      // Totals
      const totalsX = pageW - margin - 55;
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.muted);
      doc.text("Subtotal", totalsX, y);
      doc.setTextColor(...BRAND.ink);
      doc.text(money(sub, o.currency), pageW - margin - 3, y, { align: "right" });
      y += 6;
      if (Number(o.discount_cents || 0) > 0) {
        doc.setTextColor(...BRAND.muted);
        doc.text(`Discount${o.promo_code ? ` (${o.promo_code})` : ""}`, totalsX, y);
        doc.setTextColor(...BRAND.emerald);
        doc.text(`- ${money(o.discount_cents, o.currency)}`, pageW - margin - 3, y, { align: "right" });
        y += 6;
      }
      doc.setDrawColor(...BRAND.border);
      doc.line(totalsX, y - 1, pageW - margin, y - 1);
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...BRAND.primary);
      doc.text("TOTAL", totalsX, y);
      doc.text(money(o.total_cents, o.currency), pageW - margin - 3, y, { align: "right" });
      y += 12;

      // Order details section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.ink);
      doc.text("Order details", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.muted);

      const details: Array<[string, string]> = [
        ["Order ID", o.id],
        ["Service", `${o.service_label} (${o.service_id})`],
        ["Quantity", `${qty.toLocaleString()} ${qty === 1 ? "record" : "records"}`],
        ["Currency", String(o.currency || "USD").toUpperCase()],
      ];
      if (o.payment_provider) details.push(["Payment method", String(o.payment_provider).toUpperCase()]);
      if (o.payment_ref) details.push(["Payment reference", String(o.payment_ref)]);
      if (o.delivered_at) details.push(["Delivered", new Date(o.delivered_at).toLocaleString()]);
      if (o.delivery_url) details.push(["Delivery link", String(o.delivery_url)]);

      details.forEach(([k, v]) => {
        doc.setTextColor(...BRAND.muted);
        doc.text(k, margin, y);
        doc.setTextColor(...BRAND.ink);
        const wrapped = doc.splitTextToSize(v, pageW - margin * 2 - 45);
        doc.text(wrapped, margin + 40, y);
        y += wrapped.length * 4.5 + 1.5;
      });

      // Metadata extras (apollo urls, notes)
      const md = (o.metadata || {}) as Record<string, any>;
      const apolloUrls: string[] = Array.isArray(md.apollo_urls)
        ? md.apollo_urls
        : typeof md.apollo_urls === "string"
          ? md.apollo_urls.split(/\r?\n/).filter(Boolean)
          : [];
      if (apolloUrls.length) {
        y += 3;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...BRAND.ink);
        doc.text("Apollo search links", margin, y);
        y += 4.5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...BRAND.muted);
        apolloUrls.forEach((u) => {
          const w = doc.splitTextToSize(`• ${u}`, pageW - margin * 2);
          if (y + w.length * 4.2 > pageH - 30) { doc.addPage(); y = 20; }
          doc.text(w, margin, y);
          y += w.length * 4.2;
        });
      }
      const notes = md.notes || o.delivery_notes;
      if (notes) {
        y += 3;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...BRAND.ink);
        doc.text("Notes", margin, y);
        y += 4.5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...BRAND.muted);
        const w = doc.splitTextToSize(String(notes), pageW - margin * 2);
        if (y + w.length * 4.2 > pageH - 30) { doc.addPage(); y = 20; }
        doc.text(w, margin, y);
        y += w.length * 4.2;
      }

      // Footer
      const footY = pageH - 22;
      doc.setDrawColor(...BRAND.border);
      doc.line(margin, footY, pageW - margin, footY);
      doc.setFontSize(8);
      doc.setTextColor(...BRAND.muted);
      const foot = isReceipt
        ? "Thank you for your payment. This receipt confirms the transaction above."
        : "Payment due upon receipt. Digital lead data sales are final and non-refundable once delivered.";
      doc.text(foot, pageW / 2, footY + 5, { align: "center" });
      doc.text(`${brandName} · House 42, Road 11, Banani, Dhaka 1213, Bangladesh · emailsly.com`, pageW / 2, footY + 10, { align: "center" });
      doc.text(`Questions? billing@emailsly.com · Ref #${o.id.slice(0, 8).toUpperCase()}`, pageW / 2, footY + 14.5, { align: "center" });

      const label = isReceipt ? "receipt" : "invoice";
      doc.save(`${label}-${o.id.slice(0, 8).toUpperCase()}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
      window.print();
    } finally {
      setDownloading(null);
    }
  }

  if (isLoading || !data?.order)
    return (
      <div className="p-10 text-center">
        <Loader2 className="mx-auto size-5 animate-spin" />
      </div>
    );

  const o = data.order;
  const isPaid = o.payment_status === "paid";
  return (
    <div className="min-h-screen bg-background p-6 print:p-0">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex flex-wrap justify-end gap-2 print:hidden">
          <button
            onClick={() => buildPdf("invoice")}
            disabled={!!downloading}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: "#418df1" }}
          >
            {downloading === "invoice" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {downloading === "invoice" ? "Preparing…" : "Download Invoice"}
          </button>
          {isPaid && (
            <button
              onClick={() => buildPdf("receipt")}
              disabled={!!downloading}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: "#10b981" }}
            >
              {downloading === "receipt" ? <Loader2 className="size-4 animate-spin" /> : <Receipt className="size-4" />}
              {downloading === "receipt" ? "Preparing…" : "Download Paid Receipt"}
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-secondary"
          >
            <Printer className="size-4" /> Print
          </button>
        </div>

        {/* On-screen preview */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-neutral-900 shadow-sm print:border-0 print:shadow-none">
          <div className="mb-6 h-1.5 w-full rounded-full" style={{ background: "linear-gradient(90deg,#418df1,#7fb0f5)" }} />

          <div className="mb-6 flex items-start justify-between border-b border-neutral-200 pb-5">
            <div>
              <div className="text-xl font-bold">{brandName}</div>
              <div className="text-[11px] text-neutral-500">Lead generation & outbound data</div>
            </div>
            <div className="text-right text-[11px] text-neutral-500">
              <div>hello@emailsly.com</div>
              <div>emailsly.com</div>
              <div>House 42, Road 11, Banani</div>
              <div>Dhaka 1213, Bangladesh</div>
            </div>
          </div>

          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold" style={{ color: "#418df1" }}>
                {isPaid ? "Invoice / Receipt" : "Invoice"}
              </h1>
              <p className="text-xs text-neutral-500">#{o.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right text-xs text-neutral-500">
              <div>Date: {new Date(o.created_at).toLocaleDateString()}</div>
              <div>Status: <span className="font-semibold text-neutral-800">{o.status}</span></div>
              <div>Payment: <span className={`font-semibold ${isPaid ? "text-emerald-600" : "text-neutral-800"}`}>{o.payment_status}</span></div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">Billed to</div>
              <div className="mt-1 font-semibold">{o.email}</div>
            </div>
            <div className="sm:text-right">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">From</div>
              <div className="mt-1 font-semibold">{brandName}</div>
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
                <td colSpan={2} className="pt-3 text-right font-semibold uppercase tracking-wider" style={{ color: "#418df1" }}>
                  Total
                </td>
                <td className="pt-3 text-right font-mono text-lg font-bold" style={{ color: "#418df1" }}>
                  {money(o.total_cents, o.currency)}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="grid gap-2 text-xs text-neutral-600">
            {o.payment_provider && <div><span className="text-neutral-500">Payment method:</span> <span className="font-semibold">{String(o.payment_provider).toUpperCase()}</span></div>}
            {o.payment_ref && <div className="break-all"><span className="text-neutral-500">Payment reference:</span> {o.payment_ref}</div>}
            {o.delivered_at && <div><span className="text-neutral-500">Delivered:</span> {new Date(o.delivered_at).toLocaleString()}</div>}
            {o.delivery_url && <div className="break-all"><span className="text-neutral-500">Delivery link:</span> {o.delivery_url}</div>}
          </div>

          <div className="mt-10 border-t border-neutral-200 pt-4 text-[11px] leading-relaxed text-neutral-500">
            <p className="font-semibold text-neutral-700">Thank you for choosing {brandName}.</p>
            <p className="mt-1">
              Payment is due upon receipt. All sales of digital lead data are final and non-refundable
              once delivered, per our refund policy at emailsly.com/refund-policy.
            </p>
            <p className="mt-1">
              Questions about this invoice? Email billing@emailsly.com and quote invoice
              #{o.id.slice(0, 8).toUpperCase()}.
            </p>
            <p className="mt-3 text-center text-neutral-400">
              {brandName} · House 42, Road 11, Banani, Dhaka 1213, Bangladesh · emailsly.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
