import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useState } from "react";
import { Search, Package, Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Track your order | LyraData" },
      { name: "description", content: "Look up your LyraData order by order ID and email to see status and download deliverables." },
    ],
  }),
  component: Track,
});

function Track() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "not-found" | "found">("idle");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Backend coming next turn. For now, show a friendly "not found" state.
    setState(orderId && email ? "not-found" : "idle");
  };

  return (
    <SiteShell>
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-display text-4xl font-bold">Track your order</h1>
          <p className="mt-2 text-muted-foreground">
            Enter your order ID and the email you used at checkout.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-6">
            <div>
              <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Order ID
              </label>
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="SRV-XXXXXX"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-violet"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-violet"
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet py-3 font-semibold text-white shadow-lg shadow-violet/20"
            >
              <Search className="size-4" /> Look up order
            </button>
          </form>

          {state === "not-found" && (
            <div className="mt-6 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              We couldn't find that order. Order lookup will go live when we finish wiring the payments backend — check back shortly.
            </div>
          )}

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Package, title: "Confirmed", desc: "Payment received, queued for delivery." },
              { icon: Clock, title: "In progress", desc: "Data pull and verification in flight." },
              { icon: CheckCircle2, title: "Delivered", desc: "Download link emailed and available here." },
            ].map((s) => (
              <div key={s.title} className="rounded-xl border border-border bg-card p-5">
                <s.icon className="mb-3 size-5 text-violet" />
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
