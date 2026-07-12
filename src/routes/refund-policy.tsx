import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({ meta: [{ title: "Refund Policy | LyraData" }, { name: "description", content: "Our refund and replacement policy for lead data orders." }] }),
  component: () => (
    <LegalPage title="Refund Policy" updated="July 11, 2026">
      <p>We stand behind the quality of every list we deliver.</p>
      <h2>Bounce guarantee</h2>
      <p>If more than 2% of the emails in a delivered list hard-bounce within 30 days, we will replace every failed lead for free and credit 10% of the order total toward your next order.</p>
      <h2>Before delivery</h2>
      <p>Orders can be cancelled with a full refund at any time before delivery begins. Contact us at <a href="mailto:support@lyradata.com">support@lyradata.com</a>.</p>
      <h2>After delivery</h2>
      <p>Delivered digital lists are non-refundable. Replacement credits under the bounce guarantee are the exclusive remedy for quality issues.</p>
      <h2>Manual research</h2>
      <p>Manual research projects can be refunded pro-rata if cancelled mid-project, minus work completed to date.</p>
    </LegalPage>
  ),
});
