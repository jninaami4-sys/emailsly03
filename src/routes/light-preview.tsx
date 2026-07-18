import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles, ArrowRight, Search, Info, X } from "lucide-react";

export const Route = createFileRoute("/light-preview")({
  head: () => ({
    meta: [
      { title: "Light Theme Preview — Emailsly" },
      { name: "description", content: "Internal light-theme component preview for design QA." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LightPreview,
});

function LightPreview() {
  // Force light mode ONLY on this page; restore prior theme on unmount.
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.classList.contains("site-light");
    const prevData = html.dataset.theme;
    html.classList.add("site-light");
    html.dataset.theme = "light";
    return () => {
      if (!prev) html.classList.remove("site-light");
      if (prevData) html.dataset.theme = prevData;
    };
  }, []);

  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-background px-6 py-14 text-foreground">
      <div className="mx-auto max-w-6xl space-y-14">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-violet backdrop-blur">
            <Sparkles className="size-3" /> Light theme QA
          </div>
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Component <span className="text-violet italic">preview</span>
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Every key surface in one place — verify the glass look, contrast, and color blending
            without switching themes.
          </p>
        </header>

        {/* Swatches */}
        <Section title="Color tokens">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {[
              ["background", "bg-background"],
              ["card", "bg-card"],
              ["secondary", "bg-secondary"],
              ["muted", "bg-muted"],
              ["primary", "bg-primary"],
              ["violet", "bg-violet"],
              ["magenta", "bg-magenta"],
              ["coral", "bg-coral"],
              ["emerald", "bg-emerald"],
              ["amber", "bg-amber"],
              ["ink", "bg-ink"],
              ["destructive", "bg-destructive"],
            ].map(([name, cls]) => (
              <div key={name} className="rounded-xl border border-border bg-card p-3">
                <div className={`h-14 w-full rounded-lg ${cls}`} />
                <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {name}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
            <h1 className="font-display text-5xl font-black">Display Heading H1</h1>
            <h2 className="font-display text-3xl font-bold">Section Heading H2</h2>
            <h3 className="font-display text-xl font-semibold">Sub Heading H3</h3>
            <p className="text-base">Body paragraph — the quick brown fox jumps over the lazy dog.</p>
            <p className="text-sm text-muted-foreground">Muted text for secondary information.</p>
            <p className="font-mono text-xs uppercase tracking-widest text-violet">
              MONO LABEL / TAG · 128
            </p>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="flex flex-wrap gap-3 rounded-2xl border border-border bg-card p-6">
            <button className="rounded-full bg-violet px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet/25 transition hover:scale-[1.02]">
              Primary
            </button>
            <button className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet">
              Dark
            </button>
            <button className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold transition hover:bg-secondary">
              Outline
            </button>
            <button className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted">
              Secondary
            </button>
            <button className="rounded-full bg-emerald px-5 py-2.5 text-sm font-semibold text-white transition">
              Success
            </button>
            <button className="rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-white transition">
              Destructive
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet to-magenta px-5 py-2.5 text-sm font-semibold text-white shadow-lg">
              Gradient <ArrowRight className="size-4" />
            </button>
            <button disabled className="rounded-full bg-violet px-5 py-2.5 text-sm font-semibold text-white opacity-50">
              Disabled
            </button>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Cards & glass surfaces">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Plain card
              </div>
              <div className="mt-2 font-display text-2xl font-bold">$12,480</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Standard card surface on background.
              </p>
            </div>

            <div
              className="rounded-2xl border border-white/40 p-6 shadow-xl"
              style={{
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(18px) saturate(140%)",
              }}
            >
              <div className="font-mono text-[10px] uppercase tracking-widest text-violet">
                Glass card
              </div>
              <div className="mt-2 font-display text-2xl font-bold">Pearl & Aurora</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Translucent white + backdrop blur.
              </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-violet to-magenta p-6 text-white shadow-xl">
              <div className="absolute -right-10 -top-10 size-32 rounded-full bg-white/30 blur-2xl" />
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/70">
                Accent card
              </div>
              <div className="mt-2 font-display text-2xl font-bold">Gradient</div>
              <p className="mt-1 text-sm text-white/85">Ensures white text stays legible.</p>
            </div>
          </div>
        </Section>

        {/* Forms */}
        <Section title="Forms">
          <form className="grid gap-4 rounded-2xl border border-border bg-card p-6 md:grid-cols-2">
            <Field label="Full name">
              <input className={inputClass} placeholder="Jane Cooper" />
            </Field>
            <Field label="Email">
              <input type="email" className={inputClass} placeholder="jane@acme.com" />
            </Field>
            <Field label="Plan">
              <select className={inputClass}>
                <option>Starter</option>
                <option>Growth</option>
                <option>Scale</option>
              </select>
            </Field>
            <Field label="Search">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input className={`${inputClass} pl-9`} placeholder="Search anything…" />
              </div>
            </Field>
            <Field label="Notes" className="md:col-span-2">
              <textarea rows={3} className={`${inputClass} resize-none`} placeholder="Type here…" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" defaultChecked className="size-4 accent-violet" />
              Subscribe to updates
            </label>
            <div className="flex items-center gap-3 md:justify-end">
              <button type="button" className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold">
                Cancel
              </button>
              <button type="button" className="rounded-full bg-violet px-4 py-2 text-sm font-semibold text-white">
                Save
              </button>
            </div>
          </form>
        </Section>

        {/* Badges & alerts */}
        <Section title="Badges & alerts">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-violet-soft text-violet">New</Badge>
              <Badge className="bg-emerald-soft text-emerald">Success</Badge>
              <Badge className="bg-amber-soft text-amber">Pending</Badge>
              <Badge className="bg-coral-soft text-coral">Alert</Badge>
              <Badge className="bg-secondary text-foreground">Neutral</Badge>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-violet/20 bg-violet-soft/60 p-4">
              <Info className="mt-0.5 size-4 text-violet" />
              <div className="text-sm">
                <div className="font-semibold text-violet">Heads up</div>
                <div className="text-muted-foreground">Informational message on tinted glass.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-emerald/20 bg-emerald-soft/60 p-4">
              <CheckCircle2 className="mt-0.5 size-4 text-emerald" />
              <div className="text-sm">
                <div className="font-semibold text-emerald">Payment received</div>
                <div className="text-muted-foreground">Order #48231 confirmed.</div>
              </div>
            </div>
          </div>
        </Section>

        {/* Table */}
        <Section title="Table">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["#48231", "Jane Cooper", "Paid", "emerald", "$1,200"],
                  ["#48230", "Wade Warren", "Pending", "amber", "$480"],
                  ["#48229", "Esther Howard", "Refunded", "coral", "$220"],
                  ["#48228", "Cody Fisher", "Paid", "emerald", "$3,900"],
                ].map(([id, name, status, color, total]) => (
                  <tr key={id} className="hover:bg-secondary/40">
                    <td className="px-4 py-3 font-mono">{id}</td>
                    <td className="px-4 py-3">{name}</td>
                    <td className="px-4 py-3">
                      <Badge className={`bg-${color}-soft text-${color}`}>{status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">{total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Modal trigger */}
        <Section title="Modal">
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-violet px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet/25"
          >
            Open modal
          </button>
        </Section>

        <footer className="pt-8 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Internal · noindex · light theme only
        </footer>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/40 p-6 shadow-2xl"
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(24px) saturate(160%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalOpen(false)}
              className="absolute right-3 top-3 rounded-full bg-secondary p-1.5 hover:bg-muted"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
            <div className="font-mono text-[10px] uppercase tracking-widest text-violet">
              Glass modal
            </div>
            <h3 className="mt-1 font-display text-2xl font-bold">Confirm action</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This dialog uses translucent white + backdrop blur so background content shows
              through without color distortion.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full bg-violet px-4 py-2 text-sm font-semibold text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-violet focus:ring-2 focus:ring-violet/20";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Badge({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${className}`}
    >
      {children}
    </span>
  );
}
