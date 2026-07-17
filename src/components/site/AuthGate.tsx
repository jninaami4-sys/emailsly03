import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Lock, ShieldCheck, Zap, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const PUBLIC_ROUTES = ["/", "/login", "/privacy-policy", "/terms", "/refund-policy", "/pricing", "/contact", "/blog", "/sample-data", "/about"];

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/blog/")) return <>{children}</>;
  if (loading) return null;
  if (user) return <>{children}</>;

  return (
    <div className="relative grid min-h-[calc(100vh-4rem)] place-items-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute -left-24 top-0 size-96 rounded-full bg-violet-soft blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-coral-soft blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-up rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-violet-soft">
          <Lock className="size-6 text-violet" />
        </div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-soft px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-violet">
          <span className="size-1.5 animate-pulse rounded-full bg-violet" />
          Members-only access
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold">Sign in to unlock EmailsLy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Access verified B2B lead data, live pricing, and your order history.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            to="/login"
            search={{ mode: "signup", redirect: pathname }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet px-5 py-3 font-semibold text-white shadow-lg shadow-violet/25 transition-transform hover:scale-[1.01]"
          >
            Get started — it's free
          </Link>
          <Link
            to="/login"
            search={{ mode: "signin", redirect: pathname }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 font-semibold hover:bg-secondary"
          >
            I already have an account
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-3 gap-2 text-left">
          {[
            { icon: ShieldCheck, label: "GDPR" },
            { icon: Zap, label: "24h delivery" },
            { icon: Clock, label: "Order history" },
          ].map((f) => (
            <li key={f.label} className="rounded-xl border border-border bg-background p-3 text-center">
              <f.icon className="mx-auto mb-1 size-4 text-emerald" />
              <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {f.label}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
