import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Clock,
  BadgeCheck,
  Sparkles,
  Minus,
  Plus,
  Lock,
  ArrowRight,
  ArrowLeft,
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
  Check,
  Rocket,
  ClipboardList,
  Wallet,
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

const STEPS = [
  { id: 1, label: "Service", icon: Sliders },
  { id: 2, label: "Configure", icon: ClipboardList },
  { id: 3, label: "Extras", icon: Sparkles },
  { id: 4, label: "Review", icon: Wallet },
] as const;

function formatUSD(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatCompact(n: number) {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}K`;
  return String(n);
}

export function OrderBuilder() {
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState("apollo");
  const service = SERVICES.find((s) => s.id === serviceId)!;
  const [mobileGroup, setMobileGroup] = useState<"data" | "growth" | "design">(service.group);
  const [quantity, setQuantity] = useState(service.minQty);
  const [extraUrls, setExtraUrls] = useState(1);
  const [verifier, setVerifier] = useState(false);
  const [rush, setRush] = useState(false);
  const [tip, setTip] = useState(0);
  const [promo, setPromo] = useState("");
  const [agree, setAgree] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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
      const comparePriceApollo = effectiveQty * 0.2;
      const comparePriceLinkedIn = effectiveQty * 0.1;
      const savings = Math.max(0, comparePriceApollo - base);
      return { base, extras, rushFee, subtotal, stripeFee, total, savings, comparePriceApollo, comparePriceLinkedIn };
    }, [service, effectiveQty, extraUrls, verifier, rush, tip]);

  const dataServices = SERVICES.filter((s) => s.group === "data");
  const growthServices = SERVICES.filter((s) => s.group === "growth");
  const designServices = SERVICES.filter((s) => s.group === "design");

  const canNext =
    step === 1 ? !!serviceId :
    step === 2 ? (service.fixed || effectiveQty >= service.minQty) :
    step === 3 ? true :
    agree && name.trim().length > 1 && /\S+@\S+\.\S+/.test(email);

  const goNext = () => setStep((s) => Math.min(4, s + 1));
  const goPrev = () => setStep((s) => Math.max(1, s - 1));

  return (
    <section id="order" className="relative overflow-hidden px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-[360px] max-w-7xl bg-[radial-gradient(ellipse_at_top,var(--violet-soft),transparent_70%)] sm:h-[560px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 -z-10 h-64 w-64 rounded-full bg-coral-soft blur-3xl sm:h-96 sm:w-96" />
      <div className="pointer-events-none absolute -left-16 top-1/3 -z-10 h-64 w-64 rounded-full bg-violet-soft blur-3xl sm:-left-24 sm:h-96 sm:w-96" />

      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet-soft px-3 py-1">
            <Rocket className="size-3 text-violet" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              Guided order builder
            </span>
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold leading-[1.05] tracking-tighter sm:text-4xl md:text-5xl">
            Build your order, <span className="text-violet">step by step</span>.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Four quick steps. No hidden fees, no back-and-forth — see your exact price the moment you finish.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:gap-x-8 sm:gap-y-3 sm:text-[11px]">
            <span className="inline-flex items-center gap-1.5 sm:gap-2">
              <BadgeCheck className="size-3.5 text-emerald sm:size-4" /> 99% verified data
            </span>
            <span className="hidden size-1 rounded-full bg-border sm:inline-block" />
            <span className="inline-flex items-center gap-1.5 sm:gap-2">
              <Clock className="size-3.5 text-violet sm:size-4" /> Delivered in ≤24h
            </span>
            <span className="hidden size-1 rounded-full bg-border sm:inline-block" />
            <span className="inline-flex items-center gap-1.5 sm:gap-2">
              <ShieldCheck className="size-3.5 text-coral sm:size-4" /> Pay after preview
            </span>
          </div>
        </div>

        {/* Stepper — mobile/tablet only */}
        <div className="mx-auto mt-6 max-w-5xl sm:mt-10 lg:hidden">
          <div className="relative flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-border bg-card/60 p-2 backdrop-blur sm:justify-between sm:gap-2 sm:p-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => (done ? setStep(s.id) : null)}
                    className={`group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-center transition-all sm:flex-row sm:gap-3 sm:px-3 sm:py-3 sm:text-left ${
                      active
                        ? "bg-violet text-white shadow-lg shadow-violet/25"
                        : done
                          ? "bg-emerald-soft text-emerald hover:bg-emerald-soft/80"
                          : "text-foreground/80"
                    }`}
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-lg sm:size-8 ${
                        active
                          ? "bg-white/15"
                          : done
                            ? "bg-emerald/15"
                            : "bg-secondary"
                      }`}
                    >
                      {done ? <Check className="size-3.5 sm:size-4" /> : <Icon className="size-3.5 sm:size-4" />}
                    </span>
                    <span className="min-w-0 sm:flex-1">
                      <span className={`hidden font-mono text-[10px] font-bold uppercase tracking-widest sm:block ${active ? "text-white/70" : done ? "text-emerald/80" : "text-muted-foreground/70"}`}>
                        Step {s.id}
                      </span>
                      <span className="block text-[11px] font-semibold leading-tight sm:truncate sm:text-sm">{s.label}</span>
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`hidden h-px flex-1 sm:block ${step > s.id ? "bg-emerald/40" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className={`mt-6 grid gap-4 sm:mt-8 sm:gap-6 ${(step === 4 || isDesktop) ? "lg:grid-cols-[1.4fr_1fr]" : "lg:grid-cols-1"}`}>
          {/* MAIN PANEL */}
          <div className="rounded-3xl border border-border bg-card p-4 shadow-[0_20px_60px_-30px_rgba(24,24,60,0.25)] sm:p-6 md:p-8 lg:p-10">
            {(step === 1 || isDesktop) && (
              <div>
                <StepHeader
                  eyebrow="Step 1 of 4"
                  title="What are we building today?"
                  subtitle="Pick the service that fits your growth goal. You can change it any time."
                />
                {/* Mobile tab switcher */}
                <div className="mt-4 block lg:hidden">
                  <CategoryTabs active={mobileGroup} onChange={setMobileGroup} />
                  <div className="mt-3 space-y-2">
                    {SERVICES.filter((s) => s.group === mobileGroup).map((s) => (
                      <ServiceChip
                        key={s.id}
                        service={s}
                        active={serviceId === s.id}
                        onClick={() => { setServiceId(s.id); setQuantity(s.fixed ? 1 : s.minQty); setMobileGroup(s.group); }}
                        accent={s.group === "data" ? "violet" : s.group === "growth" ? "coral" : "emerald"}
                      />
                    ))}
                  </div>
                </div>
                {/* Desktop grid */}
                <div className="mt-6 hidden gap-6 lg:grid lg:grid-cols-3">
                  <CategoryColumn title="Lead generation" accent="violet" services={dataServices} serviceId={serviceId} onPick={(s) => { setServiceId(s.id); setQuantity(s.minQty); }} />
                  <CategoryColumn title="Growth add-ons" accent="coral" services={growthServices} serviceId={serviceId} onPick={(s) => { setServiceId(s.id); setQuantity(s.fixed ? 1 : s.minQty); }} />
                  <CategoryColumn title="Design & web" accent="emerald" services={designServices} serviceId={serviceId} onPick={(s) => { setServiceId(s.id); setQuantity(1); }} />
                </div>
              </div>
            )}

            {isDesktop && <div className="my-8 border-t border-dashed border-border" />}

            {(step === 2 || isDesktop) && (
              <div>
                <StepHeader
                  eyebrow="Step 2 of 4"
                  title={service.fixed ? "Confirm the scope" : "Set the volume"}
                  subtitle={service.fixed ? "This is a flat-price service — review the details below." : "Slide to your target volume. Watch the price update live."}
                />

                <div className="mt-6 rounded-2xl border border-violet/20 bg-violet-soft/50 p-4 sm:mt-8 sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-violet text-white sm:size-10">
                      <service.icon className="size-4 sm:size-5" />
                    </span>
                    <div>
                      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet/80">Selected service</div>
                      <div className="text-base font-bold sm:text-lg">{service.name}</div>
                    </div>
                  </div>
                </div>

                {!service.fixed && (
                  <div className="mt-6 sm:mt-8">
                    <SectionLabel icon={Layers} rightText={`Min ${service.minQty.toLocaleString()}`}>
                      {service.unit === "lead" ? "Lead quantity" : "Quantity"}
                    </SectionLabel>
                    <div className="rounded-2xl border border-border bg-secondary/40 p-4 sm:p-6">
                      <div className="flex items-baseline justify-between">
                        <div className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                          {effectiveQty.toLocaleString()}
                          <span className="ml-2 font-sans text-sm font-medium text-muted-foreground">{service.unit}s</span>
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
                        aria-label="Quantity"
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

                    <div className="mt-6 sm:mt-8">
                      <SectionLabel icon={Tag}>Price comparison</SectionLabel>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <ComparePill label="Apollo.io retail" price={comparePriceApollo} note={`${(comparePriceApollo / base).toFixed(0)}× more`} tone="muted" />
                        <ComparePill label="LinkedIn Nav" price={comparePriceLinkedIn} note={`${(comparePriceLinkedIn / base).toFixed(0)}× more`} tone="muted" />
                        <ComparePill label="Our price" price={base} note="Base subtotal" tone="violet" />
                        <ComparePill label="You save" price={savings} note={`${Math.round((savings / comparePriceApollo) * 100) || 0}% less`} tone="emerald" />
                      </div>
                    </div>
                  </div>
                )}

                {service.id === "apollo" && (
                  <div className="mt-6 grid gap-4 sm:mt-8 md:grid-cols-2 md:gap-6">
                    <div>
                      <SectionLabel icon={Zap} rightText="1st free · +$5 each extra">
                        Apollo search URLs
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

                    <Field label="Apollo search links">
                      <textarea
                        placeholder="https://app.apollo.io/#/people?..."
                        rows={2}
                        className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-violet focus:ring-4 focus:ring-violet/10"
                      />
                    </Field>
                  </div>
                )}

                <div className="mt-5 sm:mt-6">
                  <Field label="Notes (optional)">
                    <textarea
                      placeholder="Any specific instructions, ICP notes, or delivery preferences…"
                      rows={2}
                      className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-violet focus:ring-4 focus:ring-violet/10"
                    />
                  </Field>
                </div>
              </div>
            )}

            {isDesktop && <div className="my-8 border-t border-dashed border-border" />}

            {(step === 3 || isDesktop) && (
              <div>
                <StepHeader
                  eyebrow="Step 3 of 4"
                  title="Boost your order"
                  subtitle="Optional upgrades that make the delivery faster and cleaner."
                />
                <div className="mt-6 grid gap-3 sm:mt-8 md:grid-cols-2">
                  <AddonToggle
                    active={verifier}
                    onToggle={() => setVerifier((v) => !v)}
                    title="MillionVerifier"
                    sub="99% deliverability estimate"
                    price="+$0.002 / lead"
                    accent="emerald"
                  />
                  <AddonToggle
                    active={rush}
                    onToggle={() => setRush((r) => !r)}
                    title="Rush order"
                    sub="Priority queue · fastest turnaround"
                    price="+25%"
                    accent="coral"
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4 sm:mt-10 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-violet/10 text-violet">
                      <Sparkles className="size-5" />
                    </span>
                    <div>
                      <div className="text-sm font-semibold">Running total</div>
                      <div className="font-mono text-[11px] text-muted-foreground">Before Stripe fees</div>
                    </div>
                    <div className="ml-auto font-display text-3xl font-bold tracking-tight text-violet">
                      {formatUSD(subtotal)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isDesktop && <div className="my-8 border-t border-dashed border-border" />}

            {(step === 4 || isDesktop) && (
              <div>
                <StepHeader
                  eyebrow="Step 4 of 4"
                  title="Almost there — your details"
                  subtitle="We'll send the preview and delivery link to this address."
                />
                <div className="mt-6 grid gap-4 sm:mt-8 md:grid-cols-2">
                  <Field label="Your name">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-violet focus:ring-4 focus:ring-violet/10"
                    />
                  </Field>
                  <Field label="Work email">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-violet focus:ring-4 focus:ring-violet/10"
                    />
                  </Field>
                </div>

                <label className="mt-6 flex items-start gap-3 text-sm text-muted-foreground sm:mt-8">
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
            )}

            {/* Nav */}
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4 sm:mt-10 sm:pt-6 lg:hidden">
              <button
                type="button"
                onClick={goPrev}
                disabled={step === 1}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-foreground/20 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:py-3"
              >
                <ArrowLeft className="size-4" /> Back
              </button>
              <div className="hidden font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground sm:block">
                {step === 4 ? "Ready to checkout" : `${STEPS.length - step} step${STEPS.length - step === 1 ? "" : "s"} left`}
              </div>
              {step < 4 && (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canNext}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:px-6 sm:py-3"
                >
                  Continue <ArrowRight className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* SUMMARY — only on step 4 */}
          {step === 4 && (
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-ink p-6 text-white shadow-[0_30px_80px_-30px_rgba(24,24,60,0.5)] md:p-8">
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

                <div className="relative mt-5 flex items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3">
                  <label htmlFor="tip" className="text-sm text-white/70">Tip</label>
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

                <div className="relative mt-6 space-y-2 border-t border-white/10 pt-5 text-sm">
                  <div className="flex items-center justify-between text-white/70">
                    <span>Order subtotal</span>
                    <span className="font-mono">{formatUSD(subtotal)}</span>
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
          )}
        </div>

        {/* Live mini-total on steps 1-3 */}
        {step < 4 && (
          <div className="mx-auto mt-4 flex max-w-5xl items-center justify-between rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur sm:mt-6 sm:px-6 sm:py-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-violet/10 text-violet sm:size-9">
                <Wallet className="size-3.5 sm:size-4" />
              </span>
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live estimate</div>
                <div className="text-sm font-semibold">{service.name}{!service.fixed && ` · ${effectiveQty.toLocaleString()} ${service.unit}s`}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-xl font-bold tracking-tight text-violet sm:text-2xl">{formatUSD(subtotal)}</div>
              <div className="font-mono text-[10px] text-muted-foreground">before Stripe fee</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- helpers ---------- */

function StepHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="max-w-2xl">
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">{eyebrow}</div>
      <h3 className="mt-2 font-display text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground md:text-base">{subtitle}</p>
    </div>
  );
}

function CategoryTabs({
  active,
  onChange,
}: {
  active: "data" | "growth" | "design";
  onChange: (g: "data" | "growth" | "design") => void;
}) {
  const tabs = [
    { id: "data" as const, label: "Lead generation", accent: "violet" as const },
    { id: "growth" as const, label: "Growth", accent: "coral" as const },
    { id: "design" as const, label: "Design", accent: "emerald" as const },
  ];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => {
        const isActive = active === t.id;
        const activeClasses = {
          violet: "border-violet bg-violet text-white shadow-md shadow-violet/25",
          coral: "border-coral bg-coral text-white shadow-md shadow-coral/25",
          emerald: "border-emerald bg-emerald text-white shadow-md shadow-emerald/25",
        }[t.accent];
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
              isActive ? activeClasses : "border-border bg-background text-muted-foreground hover:border-foreground/20"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function CategoryColumn({
  title,
  accent,
  services,
  serviceId,
  onPick,
}: {
  title: string;
  accent: "violet" | "coral" | "emerald";
  services: Service[];
  serviceId: string;
  onPick: (s: Service) => void;
}) {
  const dot = {
    violet: "bg-violet",
    coral: "bg-coral",
    emerald: "bg-emerald",
  }[accent];
  return (
    <div className="rounded-2xl border border-border bg-secondary/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`size-2 rounded-full ${dot}`} />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="space-y-2">
        {services.map((s) => (
          <ServiceChip
            key={s.id}
            service={s}
            active={serviceId === s.id}
            onClick={() => onPick(s)}
            accent={accent}
          />
        ))}
      </div>
    </div>
  );
}

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
      className={`group flex w-full items-center gap-2.5 rounded-xl border bg-background px-3 py-2.5 text-left transition-all sm:gap-3 sm:py-3 ${
        active ? activeClasses : "border-border hover:border-foreground/20"
      }`}
    >
      <span className={`grid size-7 shrink-0 place-items-center rounded-lg sm:size-8 ${iconBg}`}>
        <Icon className="size-3.5 sm:size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-xs font-semibold ${active ? "" : "text-foreground"}`}>
          {service.name}
        </span>
        <span className={`mt-0.5 block truncate font-mono text-[10px] ${active ? "opacity-70" : "text-muted-foreground"}`}>
          {service.fixed ? `$${service.minOrder} flat` : `$${service.rate.toFixed(4)}/${service.unit}`}
        </span>
      </span>
      {active && <Check className="size-4 shrink-0" />}
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
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all sm:px-5 sm:py-4 ${
        active ? activeClasses : "border-border bg-background hover:border-foreground/20"
      }`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
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
