import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({ meta: [{ title: "Refund Policy | EmailsLy" }, { name: "description", content: "Our delivery and refund policy for lead data orders." }] }),
  component: () => (
    <LegalPage
      title="Refund Policy"
      updated="July 11, 2026"
      intro="We stand behind every list we deliver. Here's exactly how cancellations, refunds, and delivery work."
    >
      <p>We stand behind the quality of every list we deliver.</p>
      <h2>Data quality</h2>
      <p>All lists are sourced from pre-built, verified databases and formatted for your exact ICP before delivery. We clean, structure, and enrich every file so it's ready to import into your CRM.</p>
      <h2>Before delivery</h2>
      <p>Orders can be cancelled with a full refund at any time before delivery begins. Contact us at <a href="mailto:support@emailsly.com">support@emailsly.com</a>.</p>
      <h2>After delivery</h2>
      <p>Delivered digital lists are non-refundable. Because our data is scraped from pre-built databases and formatted to order, we do not offer real-time verification or bounce replacement guarantees.</p>
      <h2>Manual research</h2>
      <p>Manual research projects are human-verified and can be refunded pro-rata if cancelled mid-project, minus work completed to date.</p>
    </LegalPage>
  ),
});
