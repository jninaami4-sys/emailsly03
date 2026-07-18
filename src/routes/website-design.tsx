import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/website-design")({
  head: () => ({
    meta: [
      { title: "B2B Website Design | EmailsLy" },
      { name: "description", content: "Conversion-focused B2B website design for outbound teams. From landing pages to full brand sites." },
      { property: "og:title", content: "B2B Website Design" },
      { property: "og:description", content: "Conversion-focused B2B websites, built to convert cold traffic." },
    ],
    links: [{ rel: "canonical", href: "/website-design" }],
  }),
  component: WebsiteDesign,
});

function WebsiteDesign() {
  return (
    <SiteShell>
      <section className="px-6 py-20 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex rounded-full bg-coral-soft px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-coral">
            Website Design
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold lg:text-5xl">
            The website your cold traffic actually{" "}
            <span className="relative inline-block">
              <span className="relative z-10 italic">converts</span>
              <span className="absolute -bottom-1 left-0 h-3 w-full -rotate-1 bg-coral/15" />
            </span>{" "}
            on.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Landing pages and full B2B sites built for teams doing outbound. Conversion-first, on-brand, launched in 2–4 weeks.
          </p>
          <div className="mt-8">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-violet px-6 py-3 font-semibold text-white shadow-lg shadow-violet/20"
            >
              Start a project <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            { title: "Landing page", price: "$1,500", desc: "Single-page conversion machine.", features: ["1 page", "Copywriting included", "3 revisions", "1-week delivery"] },
            { title: "Full B2B site", price: "$4,500", desc: "Everything a founder needs.", features: ["Up to 8 pages", "Copywriting included", "Blog / CMS", "2–3 weeks"], popular: true },
            { title: "Custom build", price: "Custom", desc: "Product-led site with integrations.", features: ["Unlimited scope", "Framer or Next.js", "CRM + analytics", "4–6 weeks"] },
          ].map((t) => (
            <div
              key={t.title}
              className={`relative rounded-2xl border p-6 ${t.popular ? "border-violet shadow-xl shadow-violet/10" : "border-border"} bg-background`}
            >
              {t.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-violet px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold">{t.title}</h3>
              <p className="text-sm text-muted-foreground">{t.desc}</p>
              <div className="mt-4 font-display text-3xl font-bold">{t.price}</div>
              <ul className="mt-6 space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="mt-6 block w-full rounded-xl bg-ink py-2.5 text-center text-sm font-semibold text-white hover:bg-violet"
              >
                Get in touch
              </Link>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
