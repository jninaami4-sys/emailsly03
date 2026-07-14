import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  Printer,
  ArrowRight,
  Sparkles,
  Mail,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { PremiumLogoMark } from "@/components/site/PremiumIcons";
import { Loader713Panel } from "@/components/site/Loader713";

export const Route = createFileRoute("/payment-success")({
  component: PaymentSuccessPage,
  validateSearch: (s: Record<string, unknown>) => ({
    order: typeof s.order === "string" ? s.order : undefined,
    amount: typeof s.amount === "string" ? s.amount : undefined,
    subtotal: typeof s.subtotal === "string" ? s.subtotal : undefined,
    fee: typeof s.fee === "string" ? s.fee : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
    name: typeof s.name === "string" ? s.name : undefined,
    service: typeof s.service === "string" ? s.service : undefined,
    qty: typeof s.qty === "string" ? s.qty : undefined,
    unit: typeof s.unit === "string" ? s.unit : undefined,
    base: typeof s.base === "string" ? s.base : undefined,
    extraUrls: typeof s.extraUrls === "string" ? s.extraUrls : undefined,
    verifier: typeof s.verifier === "string" ? s.verifier : undefined,
    rush: typeof s.rush === "string" ? s.rush : undefined,
    rushFee: typeof s.rushFee === "string" ? s.rushFee : undefined,
    tip: typeof s.tip === "string" ? s.tip : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment successful — LyraData" },
      { name: "description", content: "Your order has been received and payment confirmed." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});


function genOrderId() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LD-${yy}${mm}${dd}-${rand}`;
}

function PaymentSuccessPage() {
  const search = Route.useSearch();
  const [now] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(t);
  }, []);
  const orderId = useMemo(() => search.order || genOrderId(), [search.order]);
  const invoiceNo = useMemo(
    () => `INV-${orderId.replace(/^LD-/, "")}`,
    [orderId],
  );
  const amountNum = Number(search.amount ?? 79);
  const amount = Number.isFinite(amountNum) ? amountNum : 79;
  const email = search.email || "customer@example.com";
  const name = search.name || "Valued Customer";
  const service = search.service || "SaaS Founders & Decision Makers";
  const qty = Number(search.qty ?? 5000);
  const unit = search.unit || "lead";

  const feeNum = Number(search.fee ?? NaN);
  const subtotalNum = Number(search.subtotal ?? NaN);
  const fee = Number.isFinite(feeNum) ? feeNum : Math.max(0, amount * 0.029 + 0.3);
  const subtotal = Number.isFinite(subtotalNum) ? subtotalNum : Math.max(0, amount - fee);
  const tax = 0;
  const total = amount;

  const baseNum = Number(search.base ?? NaN);
  const base = Number.isFinite(baseNum) ? baseNum : subtotal;
  const extraUrls = Number(search.extraUrls ?? 1);
  const extraUrlsCost = Math.max(0, extraUrls - 1) * 5;
  const verifierOn = search.verifier === "1";
  const verifierCost = verifierOn ? qty * 0.002 : 0;
  const rushOn = search.rush === "1";
  const rushFeeNum = Number(search.rushFee ?? NaN);
  const rushFee = Number.isFinite(rushFeeNum) ? rushFeeNum : 0;
  const tipNum = Number(search.tip ?? 0);
  const tip = Number.isFinite(tipNum) ? tipNum : 0;

  const unitPrice = qty > 0 ? base / qty : base;

  const lineItems: LineItem[] = [
    {
      title: service,
      note: `Verified contacts · CSV delivery · 24h SLA`,
      qty,
      unit,
      unitPrice,
      amount: base,
    },
  ];
  if (extraUrlsCost > 0) {
    lineItems.push({
      title: "Additional URLs / sources",
      note: `${extraUrls} URLs (first included, $5 per extra)`,
      qty: extraUrls - 1,
      unit: "url",
      unitPrice: 5,
      amount: extraUrlsCost,
    });
  }
  if (verifierCost > 0) {
    lineItems.push({
      title: "MillionVerifier email verification",
      note: "Deliverability check on every email",
      qty,
      unit: "email",
      unitPrice: 0.002,
      amount: verifierCost,
    });
  }
  if (rushFee > 0 || rushOn) {
    lineItems.push({
      title: "Rush order (+25%)",
      note: "Priority queue · fastest turnaround",
      qty: 1,
      unit: "rush",
      unitPrice: rushFee,
      amount: rushFee,
    });
  }
  if (tip > 0) {
    lineItems.push({
      title: "Tip",
      note: "Thanks for the love ❤️",
      qty: 1,
      unit: "tip",
      unitPrice: tip,
      amount: tip,
    });
  }

  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const receiptFilename = `${invoiceNo}.html`;
  const receiptHref = useMemo(
    () =>
      "data:text/html;charset=utf-8," +
      encodeURIComponent(
        buildReceiptHtml({
          orderId,
          invoiceNo,
          dateStr,
          timeStr,
          name,
          email,
          lineItems,
          subtotal,
          fee,
          tax,
          total,
        }),
      ),
    [orderId, invoiceNo, dateStr, timeStr, name, email, lineItems, subtotal, fee, tax, total],
  );


  if (loading)
    return (
      <Loader713Panel
        chip="Secure Checkout"
        title="Confirming your payment"
        subtitle="Sit tight — we're locking in your order."
        steps={[
          "Authorizing transaction",
          "Reserving your leads",
          "Preparing your invoice",
        ]}
        systemLabel="LYRADATA · PCI-DSS"
        label="LOADING"
      />
    );

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background px-3 py-10 sm:px-4 sm:py-12 md:py-20">
      <BackdropFx />
      <div className="relative mx-auto max-w-5xl">

        {/* Success hero */}
        <div className="mb-10 text-center print:hidden">
          <SuccessMark />
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald animate-fade-in">
            <Sparkles className="size-3" /> Payment confirmed
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-6xl animate-fade-in">
            Thank you,{" "}
            <span className="relative inline-block">
              <span className="relative z-10 italic text-violet">{name.split(" ")[0]}</span>
              <span className="absolute -bottom-1 left-0 h-3 w-full -rotate-1 bg-coral-soft" />
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground animate-fade-in">
            Your order is in. A receipt has been sent to{" "}
            <span className="font-medium text-foreground">{email}</span>. Our team begins delivery
            within the next business hour.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
            >
              <Printer className="size-4" /> Print receipt
            </button>
            <a
              href={receiptHref}
              download={receiptFilename}
              className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet/25 transition-transform hover:scale-[1.02]"
            >
              <Download className="size-4" /> Download receipt
            </a>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-sm transition-transform hover:scale-[1.02]"
            >
              Back to home <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        {/* Invoice / Receipt — always white */}
        <Invoice
          orderId={orderId}
          invoiceNo={invoiceNo}
          dateStr={dateStr}
          timeStr={timeStr}
          name={name}
          email={email}
          lineItems={lineItems}
          subtotal={subtotal}
          fee={fee}
          tax={tax}
          total={total}
        />


        {/* Perks strip */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3 print:hidden">
          <Perk
            icon={<Clock className="size-4" />}
            title="Hand-crafted delivery"
            body="Your dataset is being prepared by a specialist and you'll be notified the moment it's ready."
          />
          <Perk
            icon={<Mail className="size-4" />}
            title="Receipt emailed"
            body={`Sent to ${email}`}
          />
          <Perk
            icon={<ShieldCheck className="size-4" />}
            title="Encrypted & GDPR"
            body="256-bit end-to-end. Compliance built in."
          />
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------- Success Mark ------------------------------ */
function SuccessMark() {
  return (
    <div className="relative mx-auto flex size-28 items-center justify-center">
      {/* Rings */}
      <span className="absolute inset-0 rounded-full border border-emerald/30 [animation:pingSlow_2.4s_ease-out_infinite]" />
      <span className="absolute inset-2 rounded-full border border-emerald/20 [animation:pingSlow_2.4s_ease-out_infinite] [animation-delay:.4s]" />
      <span className="absolute inset-4 rounded-full border border-emerald/10 [animation:pingSlow_2.4s_ease-out_infinite] [animation-delay:.8s]" />
      {/* Glow */}
      <span className="absolute inset-0 rounded-full bg-emerald/20 blur-2xl" />
      {/* Core */}
      <span className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald to-[oklch(0.68_0.18_155)] shadow-[0_20px_60px_-15px_oklch(0.6_0.15_155/0.6)] animate-scale-in">
        <svg viewBox="0 0 52 52" className="size-12">
          <circle
            cx="26"
            cy="26"
            r="24"
            fill="none"
            stroke="white"
            strokeOpacity="0.35"
            strokeWidth="2"
          />
          <path
            d="M14 27 L23 36 L39 18"
            fill="none"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 60,
              strokeDashoffset: 60,
              animation: "drawCheck 700ms cubic-bezier(.65,0,.35,1) 250ms forwards",
            }}
          />
        </svg>
      </span>
      {/* Confetti */}
      <Confetti />
      <style>{`
        @keyframes drawCheck { to { stroke-dashoffset: 0; } }
        @keyframes pingSlow {
          0% { transform: scale(1); opacity: .7; }
          80%, 100% { transform: scale(1.9); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const angle = (i / 22) * Math.PI * 2;
        const dist = 120 + Math.random() * 80;
        return {
          id: i,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 20,
          rot: Math.random() * 360,
          delay: Math.random() * 150,
          color: ["#7c5cff", "#ff7a70", "#22c39a", "#ffd166"][i % 4],
          size: 6 + Math.random() * 6,
        };
      }),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute left-1/2 top-1/2 block"
          style={{
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            borderRadius: 2,
            transform: `translate(-50%,-50%) rotate(${p.rot}deg)`,
            animation: `confetti 1200ms cubic-bezier(.2,.7,.2,1) ${p.delay}ms forwards`,
            // @ts-expect-error CSS var
            "--tx": `${p.x}px`,
            "--ty": `${p.y}px`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti {
          0% { opacity: 0; transform: translate(-50%,-50%) rotate(0deg); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(540deg); }
        }
      `}</style>
    </div>
  );
}

/* --------------------------------- Backdrop -------------------------------- */
function BackdropFx() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden print:hidden">
      <div className="absolute -left-32 top-10 size-96 rounded-full bg-violet/20 blur-3xl" />
      <div className="absolute -right-24 top-32 size-96 rounded-full bg-emerald/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-coral/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(oklch(0.6_0.12_280/0.06)_1px,transparent_1px)] [background-size:22px_22px] opacity-40" />
    </div>
  );
}

/* --------------------------------- Invoice --------------------------------- */
type LineItem = {
  title: string;
  note?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  amount: number;
};

function Invoice(props: {
  orderId: string;
  invoiceNo: string;
  dateStr: string;
  timeStr: string;
  name: string;
  email: string;
  lineItems: LineItem[];
  subtotal: number;
  fee: number;
  tax: number;
  total: number;
}) {
  const {
    orderId,
    invoiceNo,
    dateStr,
    timeStr,
    name,
    email,
    lineItems,
    subtotal,
    fee,
    tax,
    total,
  } = props;

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.opacity = "0";
    ref.current.style.transform = "translateY(16px)";
    requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.style.transition = "opacity 700ms ease, transform 700ms cubic-bezier(.2,.7,.2,1)";
      ref.current.style.opacity = "1";
      ref.current.style.transform = "translateY(0)";
    });
  }, []);

  return (
    <div
      ref={ref}
      className="relative mx-auto overflow-hidden rounded-2xl bg-white text-neutral-900 shadow-[0_30px_80px_-30px_rgba(15,15,40,0.35)] ring-1 ring-black/5 sm:rounded-3xl print:shadow-none print:ring-0"
    >
      {/* Top ribbon */}
      <div className="h-2 w-full bg-gradient-to-r from-violet via-coral to-emerald" />

      <div className="grid gap-6 p-5 sm:gap-8 sm:p-8 md:grid-cols-[1.4fr_1fr] md:p-12">
        {/* Left: brand + billing */}
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet to-indigo text-white shadow-md">
              <PremiumLogoMark className="size-6" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-lg font-bold leading-none">LyraData</div>
              <div className="text-[11px] uppercase tracking-widest text-neutral-500">
                Official Receipt
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 text-sm sm:grid-cols-2 sm:gap-6 sm:mt-10">
            <div className="min-w-0">
              <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                Billed to
              </div>
              <div className="truncate font-semibold">{name}</div>
              <div className="truncate text-neutral-600">{email}</div>
            </div>
            <div className="min-w-0">
              <div className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                From
              </div>
              <div className="font-semibold">LyraData, Inc.</div>
              <div className="text-neutral-600">
                548 Market St #92384
                <br />
                San Francisco, CA 94104
              </div>
            </div>
          </div>

          {/* Mobile: stacked line items */}
          <div className="mt-6 space-y-3 sm:hidden">
            {lineItems.map((item, i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-neutral-900">{item.title}</div>
                    {item.note && (
                      <div className="mt-1 text-xs text-neutral-500">{item.note}</div>
                    )}
                  </div>
                  <div className="text-right font-semibold tabular-nums">
                    ${item.amount.toFixed(2)}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                  <span>Qty {item.qty.toLocaleString()}</span>
                  <span className="tabular-nums">
                    ${item.unitPrice.toFixed(item.unitPrice < 1 ? 4 : 2)}/{item.unit}
                  </span>
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-neutral-200 p-4">
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd className="text-right tabular-nums">${subtotal.toFixed(2)}</dd>
                <dt className="text-neutral-500">Stripe processing fee (2.9% + $0.30)</dt>
                <dd className="text-right tabular-nums">${fee.toFixed(2)}</dd>
                <dt className="text-neutral-500">Tax</dt>
                <dd className="text-right tabular-nums">${tax.toFixed(2)}</dd>
              </dl>
              <div className="mt-3 flex items-center justify-between border-t border-neutral-200 pt-3">
                <span className="font-semibold">Total paid</span>
                <span className="font-display text-lg font-bold tabular-nums">
                  ${total.toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>

          {/* Desktop table */}
          <div className="mt-8 hidden overflow-x-auto rounded-2xl border border-neutral-200 sm:block">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-4 py-3 text-left font-mono text-[10px] font-semibold uppercase tracking-widest">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-widest">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-widest">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-right font-mono text-[10px] font-semibold uppercase tracking-widest">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => (
                  <tr key={i} className="border-t border-neutral-200 align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium text-neutral-900">{item.title}</div>
                      {item.note && (
                        <div className="text-xs text-neutral-500">{item.note}</div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums">
                      {item.qty.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums text-neutral-500">
                      ${item.unitPrice.toFixed(item.unitPrice < 1 ? 4 : 2)}/{item.unit}
                    </td>
                    <td className="px-4 py-4 text-right tabular-nums">
                      ${item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-neutral-200 text-sm">
                  <td className="px-4 py-2" colSpan={2} />
                  <td className="px-4 py-2 text-right text-neutral-500">Subtotal</td>
                  <td className="px-4 py-2 text-right tabular-nums">${subtotal.toFixed(2)}</td>
                </tr>
                <tr className="text-sm">
                  <td className="px-4 py-2" colSpan={2} />
                  <td className="px-4 py-2 text-right text-neutral-500">
                    Stripe processing fee (2.9% + $0.30)
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">${fee.toFixed(2)}</td>
                </tr>
                <tr className="text-sm">
                  <td className="px-4 py-2" colSpan={2} />
                  <td className="px-4 py-2 text-right text-neutral-500">Tax</td>
                  <td className="px-4 py-2 text-right tabular-nums">${tax.toFixed(2)}</td>
                </tr>
                <tr className="border-t border-neutral-200 bg-neutral-50">
                  <td className="px-4 py-3" colSpan={2} />
                  <td className="px-4 py-3 text-right font-semibold">Total paid</td>
                  <td className="px-4 py-3 text-right font-display text-lg font-bold tabular-nums">
                    ${total.toFixed(2)} USD
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>


          <p className="mt-6 text-xs text-neutral-500">
            Thank you for your business. If you have questions about this receipt, reply to your
            confirmation email or contact{" "}
            <span className="text-neutral-700">support@lyradata.com</span>.
          </p>
        </div>



        {/* Right: meta card + stamp */}
        <div className="relative">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <div className="grid gap-4 text-sm">
              <MetaRow label="Invoice #" value={invoiceNo} mono />
              <MetaRow label="Order #" value={orderId} mono />
              <MetaRow label="Date" value={dateStr} />
              <MetaRow label="Time" value={timeStr} />
              <MetaRow label="Method" value="Visa •••• 4242" />
              <MetaRow label="Status" value="Paid" pill />
            </div>
          </div>

          {/* Paid stamp */}
          <div className="pointer-events-none absolute right-2 top-2 rotate-[-14deg] select-none rounded-md border-[3px] border-emerald/70 px-3 py-1 font-display text-xl font-black uppercase tracking-widest text-emerald/70 opacity-90">
            Paid
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-5 text-xs text-neutral-500">
            <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
              What happens next
            </div>
            <ol className="space-y-2">
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald" />
                Order queued and assigned to a specialist.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald" />
                Data collection, verification & enrichment in progress.
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald" />
                Final CSV delivered straight to your inbox.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Perforated footer */}
      <div className="relative">
        <div className="absolute inset-x-0 -top-2 h-4 bg-[radial-gradient(circle_at_8px_8px,white_6px,transparent_7px)] [background-size:16px_16px]" />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-neutral-200 px-5 py-4 text-[11px] text-neutral-500 sm:px-8 sm:py-5 md:px-12">
          <span className="font-mono uppercase tracking-widest">
            Lyra Data · lyradata.com
          </span>
          <span className="truncate font-mono">{orderId}</span>
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  mono,
  pill,
}: {
  label: string;
  value: string;
  mono?: boolean;
  pill?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
        {label}
      </span>
      {pill ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald">
          <span className="size-1.5 rounded-full bg-emerald" /> {value}
        </span>
      ) : (
        <span className={`text-neutral-900 ${mono ? "font-mono text-xs" : "font-medium"}`}>
          {value}
        </span>
      )}
    </div>
  );
}

function Perk({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-violet-soft text-violet">
          {icon}
        </span>
        {title}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

/* ----------------------------- Receipt HTML ------------------------------- */
function buildReceiptHtml(r: {
  orderId: string;
  invoiceNo: string;
  dateStr: string;
  timeStr: string;
  name: string;
  email: string;
  lineItems: LineItem[];
  subtotal: number;
  fee: number;
  tax: number;
  total: number;
}) {
  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
    );
  const money = (n: number) => `$${n.toFixed(2)}`;
  const itemsHtml = r.lineItems
    .map(
      (it) => `
          <tr>
            <td>
              <div style="font-weight:600;">${esc(it.title)}</div>
              ${it.note ? `<div style="color:#6b7280; font-size:12px;">${esc(it.note)}</div>` : ""}
            </td>
            <td class="num">${it.qty.toLocaleString()}</td>
            <td class="num" style="color:#6b7280;">$${it.unitPrice.toFixed(it.unitPrice < 1 ? 4 : 2)}/${esc(it.unit)}</td>
            <td class="num">${money(it.amount)}</td>
          </tr>`,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Receipt ${esc(r.invoiceNo)} — LyraData</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif; background:#f6f7fb; color:#111827; }
  .wrap { max-width: 820px; margin: 40px auto; background:#fff; border-radius: 18px; overflow:hidden; box-shadow: 0 20px 60px -30px rgba(15,15,40,.35); }
  .ribbon { height: 8px; background: linear-gradient(90deg,#7c5cff,#ff7a70,#22c39a); }
  .pad { padding: 40px; }
  .row { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; flex-wrap:wrap; }
  .brand { display:flex; align-items:center; gap:12px; }
  .brand .mark { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg,#7c5cff,#4338ca); color:#fff; display:grid; place-items:center; font-weight:800; }
  .muted { color:#6b7280; font-size:12px; text-transform:uppercase; letter-spacing:.14em; font-weight:700; }
  h1 { margin: 0; font-size: 20px; letter-spacing:-0.01em; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px; }
  table { width:100%; border-collapse: collapse; margin-top: 28px; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; }
  th, td { padding: 12px 14px; text-align:left; font-size:14px; }
  th { background:#f9fafb; color:#6b7280; font-size:11px; text-transform:uppercase; letter-spacing:.12em; }
  td.num, th.num { text-align:right; font-variant-numeric: tabular-nums; }
  tr + tr td { border-top: 1px solid #f1f5f9; }
  tfoot td { background:#fafafa; }
  .total td { font-weight:700; font-size:16px; }
  .paid { display:inline-block; border:3px solid rgba(16,185,129,.7); color:rgba(16,185,129,.9); font-weight:900; padding:4px 10px; border-radius:6px; letter-spacing:.18em; transform: rotate(-8deg); }
  .foot { padding: 18px 40px; border-top:1px dashed #e5e7eb; color:#6b7280; font-size:12px; display:flex; justify-content:space-between; }
  @media print { body { background:#fff; } .wrap { box-shadow:none; margin:0; border-radius:0; } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="ribbon"></div>
    <div class="pad">
      <div class="row">
        <div class="brand">
          <div class="mark">L</div>
          <div>
            <h1>LyraData</h1>
            <div class="muted">Official Receipt</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="muted">Invoice</div>
          <div style="font-family:ui-monospace,Menlo,monospace;">${esc(r.invoiceNo)}</div>
          <div class="paid" style="margin-top:8px;">PAID</div>
        </div>
      </div>

      <div class="grid">
        <div>
          <div class="muted">Billed to</div>
          <div style="font-weight:600; margin-top:4px;">${esc(r.name)}</div>
          <div style="color:#4b5563;">${esc(r.email)}</div>
        </div>
        <div>
          <div class="muted">From</div>
          <div style="font-weight:600; margin-top:4px;">LyraData, Inc.</div>
          <div style="color:#4b5563;">548 Market St #92384<br />San Francisco, CA 94104</div>
        </div>
        <div>
          <div class="muted">Order #</div>
          <div style="font-family:ui-monospace,Menlo,monospace; margin-top:4px;">${esc(r.orderId)}</div>
        </div>
        <div>
          <div class="muted">Date</div>
          <div style="margin-top:4px;">${esc(r.dateStr)} · ${esc(r.timeStr)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th class="num">Qty</th>
            <th class="num">Unit</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}
        </tbody>
        <tfoot>
          <tr><td colspan="2"></td><td class="num" style="color:#6b7280;">Subtotal</td><td class="num">${money(r.subtotal)}</td></tr>
          <tr><td colspan="2"></td><td class="num" style="color:#6b7280;">Stripe processing fee (2.9% + $0.30)</td><td class="num">${money(r.fee)}</td></tr>
          <tr><td colspan="2"></td><td class="num" style="color:#6b7280;">Tax</td><td class="num">${money(r.tax)}</td></tr>
          <tr class="total"><td colspan="2"></td><td class="num">Total paid</td><td class="num">${money(r.total)} USD</td></tr>
        </tfoot>
      </table>

      <p style="margin-top:24px; font-size:12px; color:#6b7280;">
        Thank you for your business. Questions? Contact support@lyradata.com.
      </p>
    </div>
    <div class="foot">
      <span>LyraData · lyradata.com</span>
      <span>${esc(r.invoiceNo)}</span>
    </div>
  </div>
</body>
</html>`;
}

