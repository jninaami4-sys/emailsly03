import { useEffect, useLayoutEffect, useState } from "react";

export type WalkthroughStep = {
  id: string;
  title: string;
  body: string;
  action: string;
};

export const ADMIN_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: "wt-brand-settings",
    title: "Brand settings",
    body: "Update the site name, logo, favicon, tagline, and primary colors.",
    action: "Change the Primary color, then press Save brand settings and reload to see it apply.",
  },
  {
    id: "wt-site-content",
    title: "Site content",
    body: "Edit hero copy, marketing sections, and CTAs shown across the storefront.",
    action: "Click any text field, change a value, then press Save changes.",
  },
  {
    id: "wt-sample-datasets",
    title: "Sample datasets",
    body: "Upload and manage the demo dataset users can preview.",
    action: "Try Upload dataset — every change is written to the audit log below.",
  },
  {
    id: "wt-sample-audit",
    title: "Dataset audit log",
    body: "Verifies role-based access: shows who uploaded or replaced the demo dataset and when.",
    action: "Scroll the list to confirm your latest change appears at the top.",
  },
  {
    id: "wt-orders",
    title: "Orders",
    body: "All customer orders with payment status and Stripe refs.",
    action: "Open an order row to inspect line items and status transitions.",
  },
  {
    id: "wt-support",
    title: "Support tickets",
    body: "Order-linked support tickets from customers.",
    action: "Open a ticket and post a reply to test the in-app + email flow.",
  },
  {
    id: "wt-referrals",
    title: "Referrals",
    body: "Referral attributions and payouts.",
    action: "Filter by status to verify referral tracking is firing.",
  },
  {
    id: "wt-stripe-events",
    title: "Stripe events",
    body: "Raw webhook events received from Stripe, joined to orders + referrals.",
    action: "Filter by type = checkout.session.completed to confirm signature-verified events.",
  },
  {
    id: "wt-pricing",
    title: "Pricing",
    body: "Live price overrides applied on top of catalog defaults.",
    action: "Change a price, save, and reload /store to see it apply instantly.",
  },
  {
    id: "wt-import-export",
    title: "Import / export",
    body: "Bulk import and export of site content, products, and settings.",
    action: "Click Export to download a JSON snapshot of current settings.",
  },
  {
    id: "wt-announcements",
    title: "Announcements",
    body: "Marketing banner + modal shown to visitors.",
    action: "Toggle an announcement live and open the storefront in a new tab to verify.",
  },
  {
    id: "wt-product-details",
    title: "Product details",
    body: "Long-form details rendered on product modals.",
    action: "Edit a product's description then open its card on the store to check.",
  },
  {
    id: "wt-tracking",
    title: "Tracking",
    body: "GTM / GA4 / Meta / TikTok pixel IDs.",
    action: "Paste a test container ID, save, then hard-reload the site.",
  },
  {
    id: "wt-conversion-events",
    title: "Conversion events",
    body: "Server-recorded fires of trackConversion across the site.",
    action: "Trigger a checkout in another tab and watch this list update.",
  },
  {
    id: "wt-server-tracking",
    title: "Server tracking",
    body: "Server-side event forwarding (CAPI) status and health.",
    action: "Click Test to send a diagnostic event.",
  },
  {
    id: "wt-debug",
    title: "Debug mode",
    body: "Enables a floating overlay on the storefront that streams live tracking events.",
    action: "Toggle it on, open the site, and watch events appear in the corner.",
  },
  {
    id: "wt-chatbot",
    title: "Chatbot",
    body: "Knowledge base + fallback replies for the storefront chatbot.",
    action: "Add a KB entry, then open the chat widget on / to test the answer.",
  },
  {
    id: "wt-reviews",
    title: "Reviews",
    body: "Approve, hide, or reply to customer reviews.",
    action: "Toggle a review's visibility and reload the site to confirm.",
  },
  {
    id: "wt-contact-leads",
    title: "Contact leads",
    body: "Submissions from /contact.",
    action: "Open a lead to reveal message + contact info.",
  },
  {
    id: "wt-social-links",
    title: "Social links",
    body: "Footer and header social profile URLs.",
    action: "Update a URL and confirm the footer icon links to the new destination.",
  },
  {
    id: "wt-product-covers",
    title: "Product cover editor",
    body: "Upload cover images for prebuilt lead products (stored per browser).",
    action: "Pick a product, drop an image, and watch the live preview card update.",
  },
];

export function AdminWalkthrough({
  open,
  onClose,
  steps,
}: {
  open: boolean;
  onClose: () => void;
  steps: WalkthroughStep[];
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const step = steps[index];

  useLayoutEffect(() => {
    if (!open || !step) return;
    const el = document.getElementById(step.id);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const measure = () => setRect(el.getBoundingClientRect());
    // Wait for scroll to settle, then measure.
    const t = window.setTimeout(measure, 350);
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, steps.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, steps.length]);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  if (!open || !step) return null;

  const pad = 8;
  const highlight = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  const cardTop = highlight
    ? Math.min(window.innerHeight - 260, Math.max(16, highlight.top + highlight.height + 12))
    : 80;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Dim + cutout via 4 sides */}
      {highlight ? (
        <>
          <div className="absolute bg-black/70" style={{ inset: 0, top: 0, height: highlight.top }} />
          <div
            className="absolute bg-black/70"
            style={{
              top: highlight.top,
              left: 0,
              width: highlight.left,
              height: highlight.height,
            }}
          />
          <div
            className="absolute bg-black/70"
            style={{
              top: highlight.top,
              left: highlight.left + highlight.width,
              right: 0,
              height: highlight.height,
            }}
          />
          <div
            className="absolute bg-black/70"
            style={{
              top: highlight.top + highlight.height,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* Highlight ring */}
          <div
            className="absolute rounded-2xl ring-2 ring-violet shadow-[0_0_0_9999px_rgba(0,0,0,0)] transition-all"
            style={{
              top: highlight.top,
              left: highlight.left,
              width: highlight.width,
              height: highlight.height,
              boxShadow: "0 0 0 2px oklch(0.52 0.24 293), 0 20px 60px -10px rgba(0,0,0,0.6)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      {/* Instruction card */}
      <div
        className="absolute left-1/2 w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-border bg-card p-5 shadow-2xl"
        style={{ top: cardTop }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
            Step {index + 1} / {steps.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-2 py-1 font-mono text-[10px] uppercase tracking-wider hover:bg-secondary"
          >
            Close
          </button>
        </div>
        <h3 className="font-display text-lg font-bold">{step.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
        <div className="mt-3 rounded-xl bg-violet/10 p-3 text-xs text-foreground">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
            Try it
          </span>
          <p className="mt-1">{step.action}</p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            disabled={index === 0}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
          >
            Back
          </button>
          <div className="flex-1 px-2">
            <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-violet transition-all"
                style={{ width: `${((index + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
          {index < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(i + 1, steps.length - 1))}
              className="rounded-xl bg-violet px-3 py-1.5 text-xs font-semibold text-white"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
