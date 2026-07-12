import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, Lock, ShieldCheck, Zap, Sparkles, Eye, EyeOff } from "lucide-react";

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
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        const target = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/";
        window.location.replace(target);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message.replace("Invalid login credentials", "Wrong email or password"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[oklch(0.14_0.03_270)] text-white">
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-40 -top-40 size-[38rem] rounded-full bg-violet blur-[120px] animate-aurora-slow" />
        <div className="absolute right-[-10rem] top-1/4 size-[34rem] rounded-full bg-coral blur-[130px] animate-aurora-med" />
        <div className="absolute bottom-[-8rem] left-1/3 size-[30rem] rounded-full bg-emerald blur-[120px] animate-aurora-fast" />
      </div>
      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-2">
        {/* Left — brand pitch */}
        <div className="hidden lg:block">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight text-white">
            <span className="grid size-6 place-items-center rounded-sm bg-violet">
              <span className="size-2 rounded-full bg-white" />
            </span>
            LYRA<span className="text-violet-foreground/90">DATA</span>
          </Link>
          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xl">
            <Sparkles className="size-3" /> Free account · No card
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight lg:text-5xl">
            The revenue team's
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 italic bg-gradient-to-r from-white via-white to-coral bg-clip-text text-transparent">
                shortcut
              </span>
              <span className="absolute -bottom-1 left-0 h-4 w-full -rotate-1 bg-coral/40 blur-sm" />
            </span>{" "}
            to pipeline.
          </h1>
          <p className="mt-4 max-w-md text-white/70">
            99% accurate B2B leads from Apollo, ZoomInfo, and LinkedIn — delivered to your CRM within 24 hours.
          </p>

          <ul className="mt-10 space-y-3">
            {[
              { icon: ShieldCheck, t: "GDPR compliant · 256-bit encrypted" },
              { icon: Zap, t: "1,200+ campaigns delivered · 99% accuracy" },
              { icon: Mail, t: "Verified emails · 100% deliverable" },
            ].map((f) => (
              <li key={f.t} className="flex items-center gap-3 text-sm text-white/85">
                <span className="grid size-8 place-items-center rounded-lg border border-white/15 bg-white/10 text-white backdrop-blur-xl">
                  <f.icon className="size-4" />
                </span>
                {f.t}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — glass form card */}
        <div className="w-full">
          <div className="relative mx-auto max-w-md">
            {/* Ring glow */}
            <div className="absolute -inset-[1px] rounded-[2rem] bg-gradient-to-br from-white/40 via-violet/30 to-coral/30 opacity-70 blur-md" />
            <div
              className="relative animate-fade-in rounded-[2rem] border border-white/20 bg-white/10 p-8 shadow-2xl"
              style={{ backdropFilter: "blur(28px) saturate(160%)" }}
            >
              {/* Sheen */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
                <div className="absolute -top-1/2 left-0 h-full w-full rotate-12 bg-gradient-to-b from-white/25 via-transparent to-transparent" />
              </div>

              <div className="relative">
                <div className="mb-6 flex rounded-2xl border border-white/15 bg-white/5 p-1 font-mono text-xs font-semibold backdrop-blur-xl">
                  {(["signup", "signin"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`flex-1 rounded-xl py-2 uppercase tracking-widest transition-all duration-300 ${
                        mode === m
                          ? "bg-white text-[oklch(0.2_0.05_270)] shadow-[0_4px_20px_-4px_rgba(255,255,255,0.5)]"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      {m === "signup" ? "Get started" : "Sign in"}
                    </button>
                  ))}
                </div>

                <h2 className="font-display text-2xl font-bold">
                  {mode === "signup" ? "Create your account" : "Welcome back"}
                </h2>
                <p className="mt-1 text-sm text-white/65">
                  {mode === "signup"
                    ? "Free forever. No credit card required."
                    : "Sign in to access your orders and pricing."}
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-white/55">
                      Work email
                    </span>
                    <div className="group relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50 transition-colors group-focus-within:text-white" />
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-white/10 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-white/40 outline-none transition-all focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20"
                        placeholder="jane@acme.com"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-widest text-white/55">
                      Password
                    </span>
                    <div className="group relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50 transition-colors group-focus-within:text-white" />
                      <input
                        type={showPassword ? "text" : "password"}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-white/10 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/40 outline-none transition-all focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20"
                        placeholder="At least 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </label>

                  {error && (
                    <div className="animate-fade-in rounded-lg border border-coral/40 bg-coral/15 px-3 py-2 text-sm text-white backdrop-blur-md">
                      {error}
                    </div>
                  )}
                  {info && (
                    <div className="animate-fade-in rounded-lg border border-emerald/40 bg-emerald/15 px-3 py-2 text-sm text-white backdrop-blur-md">
                      {info}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-5 py-3 font-semibold text-[oklch(0.2_0.05_270)] shadow-[0_10px_40px_-10px_rgba(255,255,255,0.5)] transition-all hover:shadow-[0_10px_50px_-8px_rgba(255,255,255,0.7)] active:scale-[0.99] disabled:opacity-70"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-violet/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <span className="relative flex items-center gap-2">
                      {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
                      {mode === "signup" ? "Create account" : "Sign in"}
                    </span>
                  </button>
                </form>

                <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-white/45">
                  256-bit encrypted · GDPR · No spam
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
