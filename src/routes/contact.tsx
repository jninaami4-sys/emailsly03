import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, MessageCircle, Calendar, Loader2 } from "lucide-react";
import { submitContactLead } from "@/lib/contact-leads.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Talk to sales | LyraData" },
      { name: "description", content: "Get a custom quote or ask about our lead-data services. Response within 4 business hours." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <SiteShell>
      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[2fr_1fr]">
          <div>
            <h1 className="font-display text-4xl font-bold lg:text-5xl">Get in touch</h1>
            <p className="mt-3 text-muted-foreground">
              Response within 4 business hours. Or grab time on the calendar directly.
            </p>

            {sent ? (
              <div className="mt-8 rounded-2xl border border-emerald/30 bg-emerald-soft p-6">
                <h3 className="font-display text-lg font-bold text-emerald">Message received.</h3>
                <p className="mt-1 text-sm">We'll be in touch shortly at the email you provided.</p>
              </div>
            ) : (
              <form
                className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" name="name" placeholder="Jane Doe" required />
                  <Field label="Work email" name="email" type="email" placeholder="jane@company.com" required />
                </div>
                <Field label="Company" name="company" placeholder="Acme Inc." />
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    What do you need?
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    required
                    placeholder="Describe your ICP: industry, title, geography, quantity."
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-violet"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-violet py-3 font-semibold text-white shadow-lg shadow-violet/20"
                >
                  Send message
                </button>
              </form>
            )}
          </div>
          <aside className="space-y-3">
            {[
              { icon: Mail, title: "Email", value: "hello@lyradata.com" },
              { icon: MessageCircle, title: "WhatsApp", value: "+1 (555) 010-9820" },
              { icon: Calendar, title: "Book a call", value: "cal.com/lyradata" },
            ].map((c) => (
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
