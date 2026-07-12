import { createFileRoute } from "@tanstack/react-router";
import { ServiceLanding } from "@/components/site/ServiceLanding";

export const Route = createFileRoute("/zoominfo-leads")({
  head: () => ({
    meta: [
      { title: "ZoomInfo verified leads | LyraData" },
      { name: "description", content: "ZoomInfo-sourced leads with direct-dial mobile numbers and enterprise firmographics. From $0.25/lead." },
      { property: "og:title", content: "ZoomInfo verified leads" },
      { property: "og:description", content: "Enterprise-grade B2B data with direct dials — no $15k contract." },
    ],
  }),
  component: () => (
    <ServiceLanding
      eyebrow="ZoomInfo Verified"
      title="Enterprise data,"
      highlight="without the contract."
      subtitle="Get ZoomInfo-grade firmographics and direct-dial mobile numbers without the $15,000 annual contract. Pay per lead. Delivered as CSV."
      priceFrom="$0.25 / lead"
      accent="emerald"
      bullets={[
        "Direct-dial mobile phone numbers",
        "Deep firmographic data (tech stack, funding, HQ)",
        "Verified within 30 days of delivery",
        "Ideal for outbound to Fortune 5000 and mid-market",
      ]}
      useCases={[
        { title: "Enterprise outbound", desc: "Reach VPs and C-suite with verified direct-dial mobiles." },
        { title: "Account expansion", desc: "Enrich your CRM's existing accounts with missing contacts." },
        { title: "Sales intelligence", desc: "Full firmographic context on every lead you engage." },
      ]}
    />
  ),
});
