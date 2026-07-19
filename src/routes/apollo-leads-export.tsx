import { createFileRoute } from "@tanstack/react-router";
import { ServiceLanding } from "@/components/site/ServiceLanding";

export const Route = createFileRoute("/apollo-leads-export")({
  head: () => ({
    meta: [
      { title: "Apollo Leads Export — Verified B2B Leads | EmailsLy" },
      { name: "description", content: "Custom Apollo.io lead exports. Verified emails, direct dials, firmographics. Pay per lead, delivered in 24 hours." },
      { property: "og:title", content: "Apollo Leads Export — Verified B2B Leads" },
      { property: "og:description", content: "Custom Apollo exports at $0.12/lead. No subscription." },
    ],
    links: [{ rel: "canonical", href: "/apollo-leads-export" }],
  }),
  component: () => (
    <ServiceLanding
      eyebrow="Apollo Data Export"
      title="Apollo exports with"
      highlight="surgical filters."
      subtitle="Bypass Apollo's credit limits. We run your custom filters against the full 275M-contact database, apply proprietary cleaning, and deliver a verified CSV in 24 hours."
      priceFrom="$0.12 / lead"
      accent="violet"
      bullets={[
        "Verified work emails + LinkedIn URLs",
        "Full firmographic enrichment (revenue, headcount, tech stack)",
        "Multi-source enrichment and formatting for your ICP",
        "CSV, JSON, or direct HubSpot / Salesforce import",
      ]}
      useCases={[
        { title: "Outbound at scale", desc: "Fill your SDR sequences with fresh, verified TAM without paying Apollo's seat fees." },
        { title: "Account-based marketing", desc: "Enrich a target account list with every decision-maker contact." },
        { title: "Market research", desc: "Map an entire industry vertical in one export." },
      ]}
    />
  ),
});
