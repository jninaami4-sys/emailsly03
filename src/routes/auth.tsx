import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, Lock, ShieldCheck, Zap, Sparkles } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in or get started | LyraData" },
      { name: "description", content: "Sign in or create your free LyraData account to access verified B2B lead data." },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  password: z.string().min(6, { message: "At least 6 characters" }).max(72),
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      const target = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/";
      window.location.replace(target);
    }
  }, [loading, user, search.redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        setInfo("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        navigate({ to: (search.redirect as string) || "/", replace: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message.replace("Invalid login credentials", "Wrong email or password"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -left-32 -top-32 size-[32rem] rounded-full bg-violet-soft blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/3 size-[28rem] rounded-full bg-coral-soft blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 size-[24rem] -translate-x-1/2 rounded-full bg-emerald-soft blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-2">
        {/* Left — brand pitch */}
        <div className="hidden lg:block">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight">
            <span className="grid size-6 place-items-center rounded-sm bg-violet">
              <span className="size-2 rounded-full bg-white" />
            </span>
            LYRA<span className="text-violet">DATA</span>
          </Link>
          <div className="mt-10 inline-flex items-center gap-2 rounded-full bg-violet-soft px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-violet">
            <Sparkles className="size-3" /> Free account · No card
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight lg:text-5xl">
            The revenue team's
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 italic">shortcut</span>
              <span className="absolute -bottom-1 left-0 h-4 w-full -rotate-1 bg-coral-soft" />
            </span>{" "}
            to pipeline.
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            99% accurate B2B leads from Apollo, ZoomInfo, and LinkedIn — delivered to your CRM within 24 hours.
          </p>

          <ul className="mt-10 space-y-3">
            {[
              { icon: ShieldCheck, t: "GDPR compliant · 256-bit encrypted" },
              { icon: Zap, t: "1,200+ campaigns delivered · 99% accuracy" },
              { icon: Mail, t: "Verified emails · 100% deliverable" },
            ].map((f) => (
              <li key={f.t} className="flex items-center gap-3 text-sm">
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-soft text-emerald">
                  <f.icon className="size-4" />
                </span>
                {f.t}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form card */}
        <div className="w-full">
          <div className="mx-auto max-w-md animate-fade-up rounded-3xl border border-border bg-card p-8 shadow-xl">
            <div className="mb-6 flex rounded-xl bg-secondary p-1 font-mono text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-lg py-2 uppercase tracking-widest transition-colors ${
                  mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Get started
              </button>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 rounded-lg py-2 uppercase tracking-widest transition-colors ${
                  mode === "signin" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Sign in
              </button>
            </div>

            <h2 className="font-display text-2xl font-bold">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signup"
                ? "Free forever. No credit card required."
                : "Sign in to access your orders and pricing."}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Work email
                </span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
                    placeholder="jane@acme.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Password
                </span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
                    placeholder="At least 6 characters"
                  />
                </div>
              </label>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              {info && (
                <div className="rounded-lg border border-emerald/30 bg-emerald-soft px-3 py-2 text-sm text-emerald">
                  {info}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet px-5 py-3 font-semibold text-white shadow-lg shadow-violet/25 transition-transform hover:scale-[1.01] disabled:opacity-70"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                {mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              256-bit encrypted · GDPR · No spam
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
