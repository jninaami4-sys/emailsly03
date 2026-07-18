import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  RefreshCw,
  ArrowLeft,
  Mail,
  ShieldAlert,
  CreditCard,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/payment-failed")({
  component: PaymentFailedPage,
  validateSearch: (s: Record<string, unknown>) => ({
    order: typeof s.order === "string" ? s.order : undefined,
    amount: typeof s.amount === "string" ? s.amount : undefined,
    reason: typeof s.reason === "string" ? s.reason : undefined,
    code: typeof s.code === "string" ? s.code : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment failed — EmailsLy" },
      { name: "description", content: "Your payment could not be processed." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/payment-failed" }],
  }),
});

function PaymentFailedPage() {
  const search = Route.useSearch();
  const orderId = search.order || "—";
  const amount = search.amount || "0.00";
  const reason =
    search.reason ||
    "Your bank declined the charge. No funds were captured from your account.";
  const code = search.code || "card_declined";
  const email = search.email || "";

  const attemptedAt = useMemo(
    () =>
      new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [],
  );

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background px-3 py-10 sm:px-4 sm:py-12 md:py-20">
      <BackdropFx />
      <div className="relative mx-auto max-w-2xl">
        {/* Hero */}
        <div className="text-center">
          <FailMark />
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-destructive animate-fade-in">
            <ShieldAlert className="size-3" /> Payment not completed
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl animate-fade-in">
            Something{" "}
            <span className="relative inline-block">
              <span className="relative z-10 italic text-destructive">went wrong</span>
              <span className="absolute -bottom-1 left-0 h-3 w-full -rotate-1 bg-destructive/15" />
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground animate-fade-in sm:text-base">
            {reason} You have not been charged. Please try again or use a different payment method.
          </p>
        </div>

        {/* Details card */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_60px_-30px_rgba(24,24,60,0.35)] sm:rounded-3xl animate-fade-in">
          <div className="h-1.5 w-full bg-gradient-to-r from-destructive via-coral to-destructive" />
          <div className="grid gap-4 p-5 sm:p-8">
            <DetailRow
              icon={<CreditCard className="size-4" />}
              label="Attempted amount"
              value={`$${amount}`}
              mono
            />
            <DetailRow
              icon={<AlertTriangle className="size-4" />}
              label="Reason code"
              value={code}
              mono
            />
            <DetailRow
              icon={<HelpCircle className="size-4" />}
              label="Order reference"
              value={orderId}
              mono
            />
            <DetailRow
              icon={<Mail className="size-4" />}
              label="Attempted at"
              value={attemptedAt}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RefreshCw className="size-4" /> Try payment again
          </button>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Mail className="size-4" /> Contact support
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to home
          </Link>
        </div>

        {/* Help */}
        <div className="mt-8 rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted-foreground animate-fade-in">
          <div className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Common fixes
          </div>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
              Check that the card details, CVC and billing ZIP are correct.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
              Ensure the card has sufficient funds and international payments enabled.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive" />
              Try a different card or payment method{email ? `, or email us at ${email}` : ""}.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Fail Mark ------------------------------- */
function FailMark() {
  return (
    <div className="relative mx-auto flex size-28 items-center justify-center">
      <span className="absolute inset-0 rounded-full border border-destructive/30 [animation:failPing_2.4s_ease-out_infinite]" />
      <span className="absolute inset-2 rounded-full border border-destructive/20 [animation:failPing_2.4s_ease-out_infinite] [animation-delay:.4s]" />
      <span className="absolute inset-4 rounded-full border border-destructive/10 [animation:failPing_2.4s_ease-out_infinite] [animation-delay:.8s]" />
      <span className="absolute inset-0 rounded-full bg-destructive/20 blur-2xl" />
      <span className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-destructive to-[oklch(0.55_0.22_25)] shadow-[0_20px_60px_-15px_oklch(0.6_0.22_25/0.6)] [animation:failShake_600ms_ease-in-out_200ms_both,scale-in_.2s_ease-out_both]">
        <svg viewBox="0 0 52 52" className="size-12">
          <circle
            cx="26"
            cy="26"
            r="24"
            fill="none"
            stroke="white"
            strokeOpacity="0.35"
            strokeWidth="2"
          />
          <path
            d="M18 18 L34 34"
            fill="none"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            style={{
              strokeDasharray: 40,
              strokeDashoffset: 40,
              animation: "drawX 400ms cubic-bezier(.65,0,.35,1) 250ms forwards",
            }}
          />
          <path
            d="M34 18 L18 34"
            fill="none"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            style={{
              strokeDasharray: 40,
              strokeDashoffset: 40,
              animation: "drawX 400ms cubic-bezier(.65,0,.35,1) 550ms forwards",
            }}
          />
        </svg>
      </span>
      <style>{`
        @keyframes drawX { to { stroke-dashoffset: 0; } }
        @keyframes failPing {
          0% { transform: scale(1); opacity: .7; }
          80%, 100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes failShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

function BackdropFx() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 top-10 size-96 rounded-full bg-destructive/15 blur-3xl" />
      <div className="absolute -right-24 top-32 size-96 rounded-full bg-coral/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-violet/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(oklch(0.6_0.12_280/0.06)_1px,transparent_1px)] [background-size:22px_22px] opacity-40" />
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <span className="flex min-w-0 items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </span>
      <span
        className={`min-w-0 truncate text-right text-foreground ${
          mono ? "font-mono text-xs" : "text-sm font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
