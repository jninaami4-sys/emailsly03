import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MessageCircle, Calendar, Loader2 } from "lucide-react";
import { submitContactLead } from "@/lib/contact-leads.functions";
import { useSiteContent } from "@/hooks/use-site-content";
import { ogImageMeta, OG_IMAGES, matchTheme } from "@/lib/og-images";
import { isDisposableEmail, DISPOSABLE_EMAIL_MESSAGE } from "@/lib/disposable-emails";

export const Route = createFileRoute("/contact")({
  head: ({ matches }) => ({
    meta: [
      { title: "Contact — Talk to sales | EmailsLy" },
      { name: "description", content: "Get a custom quote or ask about our lead-data services. Response within 4 business hours." },
      { property: "og:title", content: "Contact EmailsLy — Talk to sales" },
      { property: "og:description", content: "Get a custom quote. Response within 4 business hours." },
      ...ogImageMeta(OG_IMAGES.default, matchTheme(matches)),

    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const contactInfo = useSiteContent("contact");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = useServerFn(submitContactLead);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      company: String(fd.get("company") ?? "").trim() || null,
      message: String(fd.get("message") ?? "").trim(),
      source: "contact_form",
      page_url: typeof window !== "undefined" ? window.location.href : null,
    };
    setSubmitting(true);
    setError(null);
    if (isDisposableEmail(payload.email)) {
      setError(DISPOSABLE_EMAIL_MESSAGE);
      setSubmitting(false);
      return;
    }
    try {
      await submit({ data: payload });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteShell>
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[2fr_1fr]">
          <div>
            <h1 className="font-display text-4xl font-bold lg:text-5xl">Get in touch</h1>
            <p className="mt-3 text-muted-foreground">
              {contactInfo.response_promise}
            </p>

            {sent ? (
              <div className="mt-8 rounded-2xl border border-emerald/30 bg-emerald-soft p-6">
                <h3 className="font-display text-lg font-bold text-emerald">Message received.</h3>
                <p className="mt-1 text-sm">We'll be in touch shortly at the email you provided.</p>
              </div>
            ) : (
              <form
                className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6"
                onSubmit={onSubmit}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" name="name" placeholder="Jane Doe" required maxLength={120} />
                  <Field label="Work email" name="email" type="email" placeholder="jane@company.com" required maxLength={255} />
                </div>
                <Field label="Company" name="company" placeholder="Acme Inc." maxLength={160} />
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    What do you need?
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    required
                    maxLength={4000}
                    placeholder="Describe your ICP: industry, title, geography, quantity."
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-violet"
                  />
                </div>
                {error && (
                  <p className="rounded-lg border border-coral/30 bg-coral/5 px-3 py-2 text-sm text-coral">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet py-3 font-semibold text-white shadow-lg shadow-violet/20 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {submitting ? "Sending..." : "Send message"}
                </button>
              </form>
            )}
          </div>
          <aside className="space-y-3">
            {[
              { icon: Mail, title: "Email", value: contactInfo.email },
              { icon: MessageCircle, title: "WhatsApp", value: contactInfo.whatsapp },
              { icon: Calendar, title: "Book a call", value: contactInfo.calendar_url },
            ].filter((c) => c.value).map((c) => (
              <div key={c.title} className="rounded-xl border border-border bg-card p-5">
                <c.icon className="mb-2 size-5 text-violet" />
                <h3 className="font-semibold">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.value}</p>
              </div>
            ))}
          </aside>
        </div>
      </section>
    </SiteShell>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        {...rest}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-violet"
      />
    </div>
  );
}
