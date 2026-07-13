import { Link } from "@tanstack/react-router";
import { PaymentLogos } from "./PaymentLogos";
import { PremiumZap, PremiumShieldCheck, PremiumArrowRight } from "./PremiumIcons";
import { openConsentPreferences } from "@/lib/consent";

const productLinks = [
  { to: "/store", label: "Lead Store" },
  { to: "/apollo-leads-export", label: "Apollo Export" },
  { to: "/linkedin-sales-navigator-leads", label: "LinkedIn" },
  { to: "/zoominfo-leads", label: "ZoomInfo" },
  { to: "/manual-lead-research", label: "Manual Research" },
] as const;

const companyLinks = [
  { to: "/pricing", label: "Pricing" },
  { to: "/website-design", label: "Website Design" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
  { to: "/track-order", label: "Track Order" },
] as const;

const legalLinks = [
  { to: "/privacy-policy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/refund-policy", label: "Refunds" },
] as const;

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-white/70">
      {/* soft violet glow, matches homepage editorial system */}
      <div className="pointer-events-none absolute -left-32 top-0 size-96 rounded-full bg-violet/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 size-96 rounded-full bg-coral/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-10">
        {/* Newsletter row */}
        <div className="grid gap-12 border-b border-white/10 pb-16 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
              <PremiumZap className="size-3 text-violet" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                Premium Brief
              </span>
            </div>
            <h3 className="font-display text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Verified insights.
              <br />
              <span className="text-violet">No free samples.</span>
            </h3>
            <p className="mt-4 max-w-md text-white/60">
              Join 4,000+ paid operators who get the market edge before the week starts.
            </p>
          </div>
          <form
            className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="work@company.com"
              className="flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3.5 text-white placeholder:text-white/40 outline-none transition-colors focus:border-violet focus:bg-white/[0.08]"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-violet px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet/30"
            >
              Subscribe <PremiumArrowRight className="size-4" />
            </button>
          </form>
        </div>

        {/* Link columns */}
        <div className="grid gap-12 py-16 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-white"
            >
              <span className="grid size-7 place-items-center rounded-md bg-violet">
                <span className="size-2 rounded-full bg-white" />
              </span>
              LYRA<span className="text-violet">DATA</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/50">
              Verified B2B leads delivered to your CRM in 24 hours. Priced by the lead, never by the seat.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["24h delivery", "Verified", "GDPR aware"].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white/70"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm md:grid-cols-3">
            <FooterColumn heading="Product" links={productLinks} />
            <FooterColumn heading="Company" links={companyLinks} />
            <FooterColumn heading="Legal" links={legalLinks} />
          </div>
        </div>

        {/* Payment methods */}
        <div className="flex flex-col items-start justify-between gap-6 border-y border-white/10 py-10 lg:flex-row lg:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white/60">
              <PremiumShieldCheck className="size-3.5 text-emerald" />
              Secure checkout
            </div>
            <p className="text-sm text-white/50">
              We accept all major payment methods for your convenience.
            </p>
          </div>
          <PaymentLogos />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 pt-8 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <span className="font-mono uppercase tracking-widest">
            © {new Date().getFullYear()} LyraData Inc. All rights reserved.
          </span>
          <div className="flex flex-wrap gap-6">
            <Link to="/privacy-policy" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-white">
              Terms
            </Link>
            <Link to="/refund-policy" className="transition-colors hover:text-white">
              Refunds
            </Link>
            <Link to="/contact" className="transition-colors hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: ReadonlyArray<{ to: string; label: string }>;
}) {
  return (
    <div className="space-y-5">
      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-white">
        {heading}
      </h4>
      <div className="flex flex-col gap-3 text-white/60">
        {links.map((l) => (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <Link key={l.to} to={l.to as any} className="w-fit transition-colors hover:text-white">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
