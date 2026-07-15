import { createFileRoute } from "@tanstack/react-router";
import { ServiceLanding } from "@/components/site/ServiceLanding";

export const Route = createFileRoute("/manual-lead-research")({
  head: () => ({
    meta: [
      { title: "Manual lead research — Human-verified B2B leads | EmailsLy" },
      { name: "description", content: "Bespoke manual B2B lead research for niche industries and unique parameters. Delivered in 48 hours." },
      { property: "og:title", content: "Manual lead research — Human-verified" },
      { property: "og:description", content: "Human researchers build your list from scratch. Any niche, any field." },
    ],
  }),
  component: () => (
    <ServiceLanding
      eyebrow="Manual Research"
      title="Human researchers,"
      highlight="niche precision."
      subtitle="When databases fall short, our research team builds your list from scratch. Any niche. Any custom data field. Delivered in 48 hours with 99%+ accuracy."
      priceFrom="$0.35 / lead"
      accent="violet"
      bullets={[
        "Human-verified against LinkedIn, company sites, and public records",
        "Any custom data field (podcast guest, conference speaker, patent holder)",
        "Ideal for niches with under 10,000 total prospects",
        "48-hour delivery with 99%+ human-verified accuracy",
      ]}
      useCases={[
        { title: "Hyper-niche industries", desc: "Vertical databases don't exist for your target — we build it manually." },
        { title: "Event or media lists", desc: "Speakers from a conference, guests from a podcast, contributors to a publication." },
        { title: "Custom criteria", desc: "'CFOs at PE-backed companies who tweeted about SaaS in the last 30 days.'" },
      ]}
    />
  ),
});
