import { useMemo, useState } from "react";
import {
  ShieldCheck,
  Clock,
  BadgeCheck,
  Sparkles,
  Minus,
  Plus,
  Lock,
  ArrowRight,
  Tag,
  Layers,
  Sliders,
  Zap,
  Target,
  Linkedin,
  Building2,
  UserSearch,
  Phone,
  MousePointerClick,
  LineChart,
  ServerCog,
  PenTool,
  Globe2,
} from "lucide-react";

type Service = {
  id: string;
  name: string;
  rate: number;
  minQty: number;
  minOrder: number;
  fixed?: boolean;
  unit: string;
  helper?: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "data" | "growth" | "design";
};

const SERVICES: Service[] = [
  { id: "apollo", name: "Apollo B2B Data", rate: 0.0035, minQty: 5000, minOrder: 20, unit: "lead", helper: "$20 / 5K · $35 / 10K+", icon: Target, group: "data" },
  { id: "zoominfo", name: "ZoomInfo Data", rate: 0.02, minQty: 1000, minOrder: 20, unit: "lead", icon: Building2, group: "data" },
  { id: "linkedin", name: "LinkedIn Lead Lists", rate: 0.01, minQty: 5000, minOrder: 50, unit: "lead", helper: "~70% include verified emails", icon: Linkedin, group: "data" },
  { id: "manual", name: "Hand-Picked Leads", rate: 0.15, minQty: 134, minOrder: 20, unit: "lead", icon: UserSearch, group: "data" },
  { id: "mobile", name: "Mobile Number Lookup", rate: 0.10, minQty: 200, minOrder: 20, unit: "record", icon: Phone, group: "growth" },
  { id: "pixel", name: "Facebook Pixel", rate: 100, minQty: 1, minOrder: 100, unit: "setup", fixed: true, icon: MousePointerClick, group: "growth" },
  { id: "ads", name: "Google Ads Launch", rate: 100, minQty: 1, minOrder: 100, unit: "setup", fixed: true, icon: LineChart, group: "growth" },
  { id: "tracking", name: "Server-Side Tracking", rate: 150, minQty: 1, minOrder: 150, unit: "setup", fixed: true, icon: ServerCog, group: "growth" },
  { id: "logo", name: "Logo & Brand Kit", rate: 50, minQty: 1, minOrder: 50, unit: "kit", fixed: true, icon: PenTool, group: "design" },
  { id: "webdesign", name: "Custom Website Build", rate: 200, minQty: 1, minOrder: 200, unit: "site", fixed: true, icon: Globe2, group: "design" },
];

const QTY_PRESETS = [5000, 10000, 15000, 20000, 50000, 100000, 250000, 500000, 1000000];

function formatUSD(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatCompact(n: number) {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}K`;
  return String(n);
}

export function OrderBuilder() {
  const [serviceId, setServiceId] = useState("apollo");
  const service = SERVICES.find((s) => s.id === serviceId)!;
  const [quantity, setQuantity] = useState(service.minQty);
  const [extraUrls, setExtraUrls] = useState(1); // 1 = first (free)
  const [verifier, setVerifier] = useState(false);
  const [rush, setRush] = useState(false);
  const [tip, setTip] = useState(0);
  const [promo, setPromo] = useState("");
  const [agree, setAgree] = useState(false);

  const effectiveQty = service.fixed ? 1 : Math.max(quantity, service.minQty);

  const { base, extras, rushFee, subtotal, stripeFee, total, savings, comparePriceApollo, comparePriceLinkedIn } =
    useMemo(() => {
      const base = service.fixed ? service.minOrder : Math.max(effectiveQty * service.rate, service.minOrder);
      const extraUrlCost = Math.max(0, extraUrls - 1) * 5;
      const verifierCost = verifier && !service.fixed ? effectiveQty * 0.002 : 0;
      const extras = extraUrlCost + verifierCost + tip;
      const rushFee = rush ? (base + extras) * 0.25 : 0;
      const subtotal = base + extras + rushFee;
      const stripeFee = subtotal * 0.029 + 0.3;
      const total = subtotal + stripeFee;
      // rough compare (Apollo standard ~$0.20/lead retail; LinkedIn Nav ~$0.10/lead retail)
      const comparePriceApollo = effectiveQty * 0.2;
      const comparePriceLinkedIn = effectiveQty * 0.1;
      const savings = Math.max(0, comparePriceApollo - base);
      return { base, extras, rushFee, subtotal, stripeFee, total, savings, comparePriceApollo, comparePriceLinkedIn };
    }, [service, effectiveQty, extraUrls, verifier, rush, tip]);

  const dataServices = SERVICES.filter((s) => s.group === "data");
  const growthServices = SERVICES.filter((s) => s.group === "growth");
  const designServices = SERVICES.filter((s) => s.group === "design");

  return (
    <section id="order" className="relative overflow-hidden px-6 py-24 lg:py-32">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[520px] max-w-6xl bg-[radial-gradient(ellipse_at_top,var(--violet-soft),transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 -z-10 h-96 w-96 rounded-full bg-coral-soft blur-3xl" />

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet-soft px-3 py-1">
            <Sparkles className="size-3 text-violet" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              Build your quote
            </span>
          </div>
          <h2 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tighter md:text-6xl">
            Get your <span className="text-violet">price</span> in seconds.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Pick a service, set the details, and see the exact cost upfront — no surprises, no hidden fees.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="size-4 text-emerald" /> 99% verified data
            </span>
            <span className="hidden size-1 rounded-full bg-border sm:inline-block" />
            <span className="inline-flex items-center gap-2">
              <Clock className="size-4 text-violet" /> Delivered in ≤24h
            </span>
            <span className="hidden size-1 rounded-full bg-border sm:inline-block" />
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-coral" /> Pay after preview
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-14 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          {/* LEFT: form */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_-30px_rgba(24,24,60,0.25)] md:p-10">
            {/* Name + Email */}
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Your name">
                <input
                  type="text"
                  placeholder="Jane Doe"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-violet focus:ring-4 focus:ring-violet/10"
                />
              </Field>
              <Field label="Work email">
                <input
                  type="email"
                  placeholder="jane@company.com"
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-violet focus:ring-4 focus:ring-violet/10"
                />
              </Field>
            </div>

            {/* Select service */}
            <div className="mt-8">
              <SectionLabel icon={Sliders}>Select service</SectionLabel>

              <GroupLabel>Lead generation</GroupLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                {dataServices.map((s) => (
                  <ServiceChip
                    key={s.id}
                    service={s}
                    active={serviceId === s.id}
                    onClick={() => {
                      setServiceId(s.id);
                      setQuantity(s.minQty);
                    }}
                    accent="violet"
                  />
                ))}
              </div>

              <GroupLabel>Growth add-ons</GroupLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                {growthServices.map((s) => (
                  <ServiceChip
                    key={s.id}
                    service={s}
                    active={serviceId === s.id}
                    onClick={() => {
                      setServiceId(s.id);
                      setQuantity(s.fixed ? 1 : s.minQty);
                    }}
                    accent="coral"
                  />
                ))}
              </div>

              <GroupLabel>Design &amp; web</GroupLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                {designServices.map((s) => (
                  <ServiceChip
                    key={s.id}
                    service={s}
                    active={serviceId === s.id}
                    onClick={() => {
                      setServiceId(s.id);
                      setQuantity(1);
                    }}
                    accent="emerald"
                  />
                ))}
              </div>
            </div>

            {/* Quantity */}
            {!service.fixed && (
              <div className="mt-8">
                <SectionLabel icon={Layers} rightText={`Min ${service.minQty.toLocaleString()}`}>
                  Lead quantity
                </SectionLabel>
                <div className="rounded-2xl border border-border bg-secondary/40 p-6">
                  <div className="flex items-baseline justify-between">
                    <div className="font-display text-4xl font-bold tracking-tight md:text-5xl">
                      {effectiveQty.toLocaleString()}
                      <span className="ml-2 font-sans text-sm font-medium text-muted-foreground">leads</span>
                    </div>
                    <div className="hidden font-mono text-xs text-muted-foreground sm:block">
                      ${service.rate.toFixed(4)} / {service.unit}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={service.minQty}
                    max={1_000_000}
                    step={Math.max(Math.round(service.minQty / 20), 1)}
                    value={effectiveQty}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="mt-4 w-full accent-violet"
                    aria-label="Lead quantity"
                  />
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {QTY_PRESETS.filter((q) => q >= service.minQty).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuantity(q)}
                        className={`rounded-full px-3 py-1.5 font-mono text-[11px] font-bold uppercase transition-all ${
                          effectiveQty === q
                            ? "bg-violet text-white shadow-sm shadow-violet/30"
                            : "bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                      >
                        {formatCompact(q)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Price comparison */}
            {!service.fixed && (
              <div className="mt-8">
                <SectionLabel icon={Tag}>Price comparison</SectionLabel>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ComparePill label="Apollo.io retail" price={comparePriceApollo} note={`${(comparePriceApollo / base).toFixed(0)}× more`} tone="muted" />
                  <ComparePill label="LinkedIn Nav" price={comparePriceLinkedIn} note={`${(comparePriceLinkedIn / base).toFixed(0)}× more`} tone="muted" />
                  <ComparePill label="Our price" price={base} note="Base subtotal" tone="violet" />
                  <ComparePill label="You save" price={savings} note={`${Math.round((savings / comparePriceApollo) * 100) || 0}% less`} tone="emerald" />
                </div>
              </div>
            )}

            {/* Apollo search URLs (only for apollo) */}
            {service.id === "apollo" && (
              <>
                <div className="mt-8">
                  <SectionLabel icon={Zap} rightText="1st free · +$5 each extra">
                    Number of Apollo search URLs
                  </SectionLabel>
                  <div className="inline-flex items-center gap-4 rounded-xl border border-input bg-background px-2 py-2">
                    <button
                      type="button"
                      onClick={() => setExtraUrls((n) => Math.max(1, n - 1))}
                      className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      aria-label="Decrease"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="min-w-6 text-center font-mono text-lg font-bold">{extraUrls}</span>
                    <button
                      type="button"
                      onClick={() => setExtraUrls((n) => n + 1)}
                      className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      aria-label="Increase"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <Field label="Apollo search links">
                    <textarea
                      placeholder="https://app.apollo.io/#/people?..."
                      rows={2}
                      className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm font-mono outline-none transition-colors placeholder:text-muted-foreground focus:border-violet focus:ring-4 focus:ring-violet/10"
                    />
                  </Field>
                </div>
              </>
            )}

            {/* Notes */}
            <div className="mt-6">
              <Field label="Notes (optional)">
                <textarea
                  placeholder="Any specific instructions, ICP notes, or delivery preferences…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-violet focus:ring-4 focus:ring-violet/10"
                />
              </Field>
            </div>

            {/* Add-ons */}
            <div className="mt-8">
              <SectionLabel icon={Sparkles}>Add-ons</SectionLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                <AddonToggle
                  active={verifier}
                  onToggle={() => setVerifier((v) => !v)}
                  title="MillionVerifier"
                  sub="99% deliverability"
                  price="+$0.002 / lead"
                  accent="emerald"
                />
                <AddonToggle
                  active={rush}
                  onToggle={() => setRush((r) => !r)}
                  title="Rush order"
                  sub="Priority delivery"
                  price="+25%"
                  accent="coral"
                />
              </div>
            </div>

            {/* Agree */}
            <label className="mt-8 flex items-start gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 size-4 rounded border-input accent-violet"
              />
              <span>
                I agree to the{" "}
                <a href="/privacy-policy" className="font-semibold text-violet hover:underline">
                  Data Usage Policy
                </a>{" "}
                and GDPR/CCPA compliance.
              </span>
            </label>
          </div>

          {/* RIGHT: order summary */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-obsidian-surface p-6 text-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)] md:p-8">
              {/* corner glow */}
              <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-violet/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 size-64 rounded-full bg-coral/15 blur-3xl" />

              <div className="relative flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">Order summary</h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white/80">
                  <Lock className="size-3" /> Secure
                </span>
              </div>

              <dl className="relative mt-6 space-y-3 text-sm">
                <SummaryRow label="Service" value={service.name} />
                <SummaryRow label="Quantity" value={service.fixed ? "1" : effectiveQty.toLocaleString()} />
                <SummaryRow label="Rate" value={service.fixed ? `${formatUSD(service.minOrder)} flat` : `$${service.rate.toFixed(4)} / ${service.unit}`} />
                <SummaryRow
                  label="Extras"
                  value={formatUSD((verifier && !service.fixed ? effectiveQty * 0.002 : 0) + Math.max(0, extraUrls - 1) * 5)}
                />
                {rush && <SummaryRow label="Rush (+25%)" value={formatUSD(rushFee)} />}
              </dl>

              {/* Tip */}
              <div className="relative mt-5 flex items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3">
                <label htmlFor="tip" className="text-sm text-white/70">
                  Tip
                </label>
                <div className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1">
                  <span className="text-xs text-white/60">$</span>
                  <input
                    id="tip"
                    type="number"
                    min={0}
                    step={1}
                    value={tip || ""}
                    onChange={(e) => setTip(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="0"
                    className="w-16 bg-transparent text-right font-mono text-sm outline-none placeholder:text-white/40"
                  />
                </div>
              </div>

              {/* Promo */}
              <div className="relative mt-3">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-white/50">
                  Promo code
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={promo}
                    onChange={(e) => setPromo(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs uppercase tracking-widest outline-none placeholder:text-white/30 focus:border-white/30"
                  />
                  <button
                    type="button"
                    className="rounded-lg bg-white/10 px-4 text-xs font-bold uppercase tracking-widest text-white/80 transition-colors hover:bg-white/15"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Totals */}
              <div className="relative mt-6 space-y-2 border-t border-white/10 pt-5 text-sm">
                <div className="flex items-center justify-between text-white/70">
                  <span>Order subtotal</span>
                  <span className="font-mono">{formatUSD(subtotal - (rush ? rushFee : 0) - tip - (verifier && !service.fixed ? effectiveQty * 0.002 : 0) - Math.max(0, extraUrls - 1) * 5 + (rush ? rushFee : 0))}</span>
                </div>
                <div className="flex items-center justify-between text-white/70">
                  <span>Stripe processing fee</span>
                  <span className="font-mono">+{formatUSD(stripeFee)}</span>
                </div>
              </div>

              <div className="relative mt-5 flex items-end justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Total charged</div>
                  <div className="text-[11px] text-white/50">Includes Stripe fee</div>
                </div>
                <div className="font-display text-4xl font-bold tracking-tight">
                  {formatUSD(total)}
                </div>
              </div>

              <button
                type="button"
                disabled={!agree}
                className="relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet px-6 py-4 text-sm font-bold text-white shadow-lg shadow-violet/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                Checkout with Stripe <ArrowRight className="size-4" />
              </button>
              <p className="relative mt-3 flex items-center justify-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white/40">
                <Lock className="size-3" /> 256-bit SSL encrypted
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- helpers ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function SectionLabel({
  icon: Icon,
  children,
  rightText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  rightText?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <span className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3.5 text-violet" />
        {children}
      </span>
      {rightText && (
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {rightText}
        </span>
      )}
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-4 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
      {children}
    </div>
  );
}

function ServiceChip({
  service,
  active,
  onClick,
  accent,
}: {
  service: Service;
  active: boolean;
  onClick: () => void;
  accent: "violet" | "coral" | "emerald";
}) {
  const activeClasses = {
    violet: "border-violet bg-violet-soft text-violet",
    coral: "border-coral bg-coral-soft text-coral",
    emerald: "border-emerald bg-emerald-soft text-emerald",
  }[accent];
  const iconBg = {
    violet: "bg-violet/10 text-violet",
    coral: "bg-coral/10 text-coral",
    emerald: "bg-emerald/10 text-emerald",
  }[accent];
  const Icon = service.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
        active ? activeClasses : "border-border bg-background hover:border-foreground/20"
      }`}
    >
      <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${iconBg}`}>
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-xs font-semibold ${active ? "" : "text-foreground"}`}>
          {service.name}
        </span>
        <span className={`mt-0.5 block truncate font-mono text-[10px] ${active ? "opacity-70" : "text-muted-foreground"}`}>
          {service.fixed ? `$${service.minOrder} flat` : `$${service.rate.toFixed(4)}/${service.unit}`}
        </span>
      </span>
    </button>
  );
}

function ComparePill({
  label,
  price,
  note,
  tone,
}: {
  label: string;
  price: number;
  note: string;
  tone: "muted" | "violet" | "emerald";
}) {
  const toneClasses = {
    muted: "border-border bg-background",
    violet: "border-violet/30 bg-violet-soft",
    emerald: "border-emerald/30 bg-emerald-soft",
  }[tone];
  const priceColor = {
    muted: "text-foreground",
    violet: "text-violet",
    emerald: "text-emerald",
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`}>
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 font-display text-xl font-bold ${priceColor}`}>{formatUSD(price)}</div>
      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{note}</div>
    </div>
  );
}

function AddonToggle({
  active,
  onToggle,
  title,
  sub,
  price,
  accent,
}: {
  active: boolean;
  onToggle: () => void;
  title: string;
  sub: string;
  price: string;
  accent: "emerald" | "coral";
}) {
  const activeClasses = {
    emerald: "border-emerald bg-emerald-soft",
    coral: "border-coral bg-coral-soft",
  }[accent];
  const dotColor = {
    emerald: "bg-emerald",
    coral: "bg-coral",
  }[accent];
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
        active ? activeClasses : "border-border bg-background hover:border-foreground/20"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`grid size-5 place-items-center rounded-full border ${
            active ? `border-transparent ${dotColor}` : "border-input bg-background"
          }`}
        >
          {active && <span className="size-2 rounded-full bg-white" />}
        </span>
        <div>
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <div className="font-mono text-[10px] text-muted-foreground">{sub}</div>
        </div>
      </div>
      <span className="font-mono text-xs font-bold text-foreground">{price}</span>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-white/60">{label}</dt>
      <dd className="font-mono text-white">{value}</dd>
    </div>
  );
}
