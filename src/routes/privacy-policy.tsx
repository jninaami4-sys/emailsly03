import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/site/LegalPage";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [{ title: "Privacy Policy | EmailsLy" }, { name: "description", content: "How EmailsLy collects, uses, and protects your data." }],
    links: [{ rel: "canonical", href: "/privacy-policy" }],
  }),
  component: () => (
    <LegalPage
      title="Privacy Policy"
      updated="July 11, 2026"
      intro="How EmailsLy Inc. collects, uses, and protects the information you share with us — written plainly, without the legalese padding."
    >
      <p>
        This Privacy Policy explains how EmailsLy Inc. ("EmailsLy", "we", "us") collects, uses, and shares
        information when you use our services. We take data protection seriously and comply with GDPR and CCPA.
      </p>
      <h2>Information we collect</h2>
      <p>Account information (name, email, billing details), order history, and any information you submit through forms or support.</p>
      <h2>How we use it</h2>
      <p>To fulfill orders, process payments, deliver customer support, and send transactional email. We never sell your data.</p>
      <h2>Lead data sourcing</h2>
      <p>Business contact data we sell is sourced from publicly available records and third-party databases we license. Individuals can request removal at any time by emailing <a href="mailto:privacy@emailsly.com">privacy@emailsly.com</a>.</p>
      <h2>Your rights (GDPR / CCPA)</h2>
      <p>You may request access to, correction of, or deletion of your personal data at any time.</p>
      <h2>Contact</h2>
      <p>Questions? Email <a href="mailto:privacy@emailsly.com">privacy@emailsly.com</a>.</p>
    </LegalPage>
  ),
});
