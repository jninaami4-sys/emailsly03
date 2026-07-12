import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service | LyraData" }, { name: "description", content: "The terms governing use of LyraData services." }] }),
  component: () => (
    <LegalPage
      title="Terms of Service"
      updated="July 11, 2026"
      intro="The ground rules for using LyraData's services. Purchasing or using our services means you agree to what's below."
    >
      <p>These Terms of Service ("Terms") govern your use of LyraData's services. By purchasing or using our services, you agree to these Terms.</p>
      <h2>Services</h2>
      <p>We provide B2B lead data and related research services on a pay-per-order basis. No subscription is required.</p>
      <h2>Acceptable use</h2>
      <p>You will not use LyraData data to send unsolicited commercial email in violation of CAN-SPAM, GDPR, PECR, or similar laws in your jurisdiction. You are responsible for compliance with all applicable outreach regulations.</p>
      <h2>Payment</h2>
      <p>Payment is processed via Stripe. Orders are non-refundable once delivered, subject to our Refund Policy.</p>
      <h2>Limitation of liability</h2>
      <p>LyraData is provided "as is". Our liability is limited to the amount you paid for the specific order in question.</p>
      <h2>Contact</h2>
      <p>Email <a href="mailto:legal@lyradata.com">legal@lyradata.com</a>.</p>
    </LegalPage>
  ),
});
