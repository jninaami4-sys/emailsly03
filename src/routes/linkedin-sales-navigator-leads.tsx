import { createFileRoute } from "@tanstack/react-router";
import { ServiceLanding } from "@/components/site/ServiceLanding";

export const Route = createFileRoute("/linkedin-sales-navigator-leads")({
  head: () => ({
    meta: [
      { title: "LinkedIn Sales Navigator leads | EmailsLy" },
      { name: "description", content: "Custom LinkedIn Sales Navigator scrapes with verified emails, trigger events, and Boolean filters. $0.15/lead." },
      { property: "og:title", content: "LinkedIn Sales Navigator leads" },
      { property: "og:description", content: "Turn any Sales-Nav search into a verified CSV in 24 hours." },
    ],
  }),
  component: () => (
    <ServiceLanding
      eyebrow="LinkedIn Sales Nav"
      title="Any Sales-Nav search,"
      highlight="delivered as CSV."
      subtitle="Send us your Sales Navigator search URL — or describe your ICP — and we'll return every profile as a verified, enriched contact record within 24 hours."
      priceFrom="$0.15 / lead"
      accent="coral"
      bullets={[
        "Any Sales Navigator filter (title, geography, headcount, intent)",
        "Verified emails appended via waterfall enrichment",
        "Job-change and funding trigger events flagged",
        "Includes company LinkedIn URL, size, and industry",
      ]}
      useCases={[
        { title: "Boolean-precise ICP", desc: "Use every Sales-Nav filter you already know — get the data out as CSV." },
        { title: "Trigger-based outbound", desc: "Fresh-hire, promotion, and funding triggers surfaced automatically." },
        { title: "Recruiting", desc: "Passive-candidate lists with verified personal or work emails." },
      ]}
    />
  ),
});
