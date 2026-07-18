import { Link } from "@tanstack/react-router";
import {
  Smartphone,
  MousePointerClick,
  LineChart,
  Server,
  PenTool,
  Globe2,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePricingOverrides } from "@/hooks/use-pricing-overrides";
import { formatAddOnPrice } from "@/lib/service-catalog";

export type AddOn = {
  id: string;
  name: string;
  icon: LucideIcon;
  desc: string;
  link?: string;
};

export const ADD_ONS: AddOn[] = [
  { id: "mobile",    name: "Apollo Mobiles",         icon: Smartphone,        desc: "Mobile number enrichment for existing lists." },
  { id: "warmup",    name: "Mailbox Warmup",         icon: ShieldCheck,       desc: "15-day warmup with DKIM, SPF & DMARC setup." },
  { id: "pixel",     name: "Facebook Pixel",         icon: MousePointerClick, desc: "Expert Pixel & CAPI setup for conversion tracking." },
  { id: "ads",       name: "Google Ads Setup",       icon: LineChart,         desc: "High-ROAS campaign structure with tracking." },
  { id: "tracking",  name: "Server-Side Tracking",   icon: Server,            desc: "Bypass ad blockers with Stape.io & GTM Server." },
  { id: "logo",      name: "Logo Design",            icon: PenTool,           desc: "Professional brand identity design." },
  { id: "webdesign", name: "AI Website Design",      icon: Globe2,            desc: "Modern, conversion-focused websites in days.", link: "/website-design" },
];


export function AddOns() {
  const overrides = usePricingOverrides();
  return (
    <section className="border-t border-border px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
            Add-ons
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Utility services, flat-rate.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Enrichment, tracking, branding, and websites — no subscriptions.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ADD_ONS.map((a) => {
            const price = formatAddOnPrice(a.id, overrides);

            const inner = (
              <>
                <div className="mb-5 inline-grid size-11 place-items-center rounded-xl bg-violet-soft text-violet">
                  <a.icon className="size-5" />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-bold">{a.name}</h3>
                  <span className="whitespace-nowrap font-mono text-[11px] font-bold text-violet">
                    {a.price}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
              </>
            );
            const cls =
              "flex flex-col rounded-2xl border border-border bg-secondary/30 p-6 transition-all hover:-translate-y-0.5 hover:border-violet/30 hover:bg-card";
            return a.link ? (
              <Link key={a.id} to={a.link} className={cls}>
                {inner}
              </Link>
            ) : (
              <div key={a.id} className={cls}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
