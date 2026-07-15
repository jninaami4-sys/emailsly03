import { useMemo, useState } from "react";
import { SERVICES } from "./PricingCalculator";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { PremiumSparkles as Sparkles } from "@/components/site/PremiumIcons";

export function OrderForm() {
  const [serviceId, setServiceId] = useState("apollo");
  const service = SERVICES.find((s) => s.id === serviceId)!;
  const [quantity, setQuantity] = useState(service.minQty);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  const total = useMemo(() => {
    if (service.fixed) return service.minOrder;
    const q = Math.max(quantity, service.minQty);
    return Math.max(q * service.rate, service.minOrder);
  }, [service, quantity]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setTimeout(() => setStatus("done"), 900);
  }

  return (
    <section id="order" className="relative overflow-hidden px-6 py-24">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-violet-soft blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 size-80 rounded-full bg-coral-soft blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet-soft px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-violet">
            <Sparkles className="size-3" /> Place your order
          </div>
          <h2 className="font-display text-3xl font-bold lg:text-5xl">
            Start your{" "}
            <span className="relative inline-block">
              <span className="relative z-10 italic text-violet">order</span>
              <span className="absolute -bottom-1 left-0 h-3 w-full -rotate-1 bg-coral-soft" />
            </span>{" "}
            below
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Tell us what you need. We reply with a secure payment link within 1 business hour.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Form */}
          <form
            onSubmit={submit}
            className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Full name" required>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Jane Cooper"
                />
              </Field>
              <Field label="Work email" required>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="jane@acme.com"
                />
              </Field>
              <Field label="Company">
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={inputClass}
                  placeholder="Acme Inc."
                />
              </Field>
              <Field label="Service" required>
                <select
                  value={serviceId}
                  onChange={(e) => {
                    const s = SERVICES.find((x) => x.id === e.target.value)!;
                    setServiceId(s.id);
                    setQuantity(s.minQty);
                  }}
                  className={inputClass}
                >
                  {SERVICES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>

              {!service.fixed && (
                <Field label={`Quantity (min ${service.minQty.toLocaleString()})`} required>
                  <input
                    type="number"
                    min={service.minQty}
                    step={service.minQty >= 1000 ? 1000 : 100}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value || "0", 10))}
                    className={inputClass}
                  />
                </Field>
              )}

              <Field label="Ideal Customer Profile / targeting" className="md:col-span-2">
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${inputClass} resize-none`}
                  placeholder="e.g. Founders & CTOs at Series A-B US SaaS, 20-200 employees…"
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={status !== "idle"}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet px-5 py-3.5 font-semibold text-white shadow-lg shadow-violet/25 transition-transform hover:scale-[1.01] disabled:opacity-70"
            >
              {status === "sending" && <Loader2 className="size-4 animate-spin" />}
              {status === "done" && <CheckCircle2 className="size-4" />}
              {status === "idle" && <Send className="size-4" />}
              {status === "done" ? "Request received" : status === "sending" ? "Sending…" : "Send my order request"}
            </button>
            <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              No spam · 256-bit encrypted · GDPR
            </p>
          </form>

          {/* Summary */}
          <aside className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-ink to-[oklch(0.28_0.05_270)] p-8 text-white">
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-violet/40 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-coral/30 blur-3xl" />
            <div className="relative">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                Order summary
              </div>
              <div className="mt-2 font-display text-2xl font-bold">{service.name}</div>
              {!service.fixed ? (
                <div className="mt-1 text-sm text-white/70">
                  {Math.max(quantity, service.minQty).toLocaleString()} {service.unit}s
                </div>
              ) : (
                <div className="mt-1 text-sm text-white/70">Fixed-fee project</div>
              )}

              <div className="my-6 h-px bg-white/10" />

              <div className="flex items-baseline justify-between">
                <span className="text-white/60">Estimated total</span>
                <span className="font-mono text-4xl font-bold tabular-nums">
                  ${total.toLocaleString()}
                </span>
              </div>

              <ul className="mt-8 space-y-3 text-sm">
                {[
                  "99% data accuracy guarantee",
                  "Delivered within 24 hours",
                  "Pre-formatted for your CRM",
                  "Secure card / bank / crypto pay",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald" />
                    <span className="text-white/85">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-violet focus:ring-2 focus:ring-violet/20";

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-coral">*</span>}
      </span>
      {children}
    </label>
  );
}
