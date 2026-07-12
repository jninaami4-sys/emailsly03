import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, Lock, ShieldCheck, Zap, BadgeCheck, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).optional(),
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

const forgotSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
});

type FieldErrors = { email?: string; password?: string };

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode ?? "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [lastEmail, setLastEmail] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem("lyra_remember_me") !== "false";
  });
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("lyra_remember_me", rememberMe ? "true" : "false");
  }, [rememberMe]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!rememberMe && window.localStorage.getItem("lyra_remember_me") === "false") {
      const handleUnload = () => {
        supabase.auth.signOut({ scope: "local" });
      };
      window.addEventListener("beforeunload", handleUnload);
      return () => window.removeEventListener("beforeunload", handleUnload);
    }
  }, [rememberMe]);


  useEffect(() => {
    if (!loading && user) {
      const target = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/";
      window.location.replace(target);
    }
  }, [loading, user, search.redirect]);

  useEffect(() => {
    if (search.mode && ["signin", "signup", "forgot"].includes(search.mode)) {
      setMode(search.mode);
    }
  }, [search.mode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function validateField(name: keyof FieldErrors, value: string) {
    const partial = credentials.partial();
    const parsed = partial.safeParse({ [name]: value });
    if (!parsed.success) {
      const issue = parsed.error.issues.find((i) => i.path[0] === name);
      setFieldErrors((prev) => ({ ...prev, [name]: issue?.message }));
      return false;
    }
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    return true;
  }

  function validateAll(): boolean {
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return false;
    }
    setFieldErrors({});
    return true;
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setTouched({ email: true, password: true });
    if (!validateAll()) return;

    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        setInfo("Check your email to confirm your account, then sign in.");
        setSignUpSuccess(true);
        setPassword("");
        setMode("signin");
      } else {

        const { error } = await supabase.auth.signInWithPassword({ email, password });
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

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setTouched({ email: true });
    const parsed = forgotSchema.safeParse({ email });
    if (!parsed.success) {
      setFieldErrors((prev) => ({ ...prev, email: parsed.error.issues[0].message }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, email: undefined }));

    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setLastEmail(parsed.data.email);
      setCooldown(60);
      setInfo("If this email exists, you'll receive a reset link shortly.");
      setEmail("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleResend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!lastEmail || cooldown > 0) return;
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(lastEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setCooldown(60);
      setInfo("Reset link resent. Check your inbox.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  const inputBase =
    "w-full rounded-xl border bg-input/50 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:bg-background focus:ring-2";
  const inputNormal = "border-border focus:border-primary/40 focus:ring-ring/20";
  const inputError = "border-destructive focus:border-destructive/70 focus:ring-destructive/20 pr-10";

  const passwordInputBase =
    "w-full rounded-xl border bg-input/50 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:bg-background focus:ring-2";

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background to-muted text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 size-[60rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-[0.04] blur-[120px]" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-2">
        <div className="hidden lg:block">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight text-foreground">
            <span className="grid size-6 place-items-center rounded-md bg-primary">
              <span className="size-2 rounded-full bg-primary-foreground" />
            </span>
            LYRA<span className="text-muted-foreground">DATA</span>
          </Link>

          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <BadgeCheck className="size-3.5 text-primary" aria-hidden="true" /> Free account · No card required
          </div>

          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.08] tracking-tight lg:text-5xl">
            The revenue team's
            <br />
            <span className="text-muted-foreground">shortcut</span> to pipeline.
          </h1>
          <p className="mt-4 max-w-md text-base text-muted-foreground">
            99% accurate B2B leads from Apollo, ZoomInfo, and LinkedIn — delivered to your CRM within 24 hours.
          </p>

          <ul className="mt-10 space-y-3">
            {[
              { icon: ShieldCheck, t: "GDPR compliant · 256-bit encrypted" },
              { icon: Zap, t: "1,200+ campaigns delivered · 99% accuracy" },
              { icon: Mail, t: "Verified emails · 100% deliverable" },
            ].map((f) => (
              <li key={f.t} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="grid size-8 place-items-center rounded-lg border border-border bg-card text-foreground shadow-sm" aria-hidden="true">
                  <f.icon className="size-4" aria-hidden="true" />
                </span>
                {f.t}
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full">
          <div className="relative mx-auto max-w-md">
            <div
              className="relative animate-fade-in rounded-[1.75rem] border border-border bg-card/80 p-8 shadow-xl backdrop-blur-xl"
              style={{ backdropFilter: "blur(24px) saturate(140%)" }}
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]">
                <div className="absolute -top-1/2 left-0 h-full w-full rotate-12 bg-gradient-to-b from-white/60 via-transparent to-transparent opacity-50" />
              </div>

              <div className="relative">
                {mode === "forgot" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setMode("signin")}
                      className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                    >
                      <ArrowLeft className="size-3.5" aria-hidden="true" /> Back to sign in
                    </button>
                    <h2 className="font-display text-2xl font-bold tracking-tight">Reset your password</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Enter your work email and we'll send you a secure reset link.
                    </p>

                    <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
                      <div>
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-muted-foreground">Work email</span>
                          <div className="group relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                            <input
                              type="email"
                              autoComplete="email"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (fieldErrors.email) validateField("email", e.target.value);
                              }}
                              onBlur={() => {
                                setTouched((t) => ({ ...t, email: true }));
                                validateField("email", email);
                              }}
                              className={`${inputBase} ${fieldErrors.email ? inputError : inputNormal}`}
                              placeholder="jane@acme.com"
                              aria-invalid={!!fieldErrors.email}
                              aria-describedby={fieldErrors.email ? "email-error" : undefined}
                            />
                            {fieldErrors.email && (
                              <AlertCircle className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-destructive" />
                            )}
                          </div>
                        </label>
                        {fieldErrors.email && (
                          <p id="email-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive animate-fade-in">
                            <AlertCircle className="size-3.5" />
                            {fieldErrors.email}
                          </p>
                        )}
                      </div>

                      {info && (
                        <div aria-live="polite" className="animate-fade-in rounded-lg border border-emerald/30 bg-emerald/10 px-3 py-3 text-sm text-emerald-foreground">
                          <p className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            {info}
                          </p>
                          {lastEmail && (
                            <button
                              type="button"
                              onClick={() => handleResend()}
                              disabled={busy || cooldown > 0}
                              className="mt-2 w-full text-center text-xs font-medium text-emerald-foreground/80 transition-colors hover:text-emerald-foreground focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {cooldown > 0 ? `Resend available in ${cooldown}s` : "Didn't receive it? Resend email"}
                            </button>
                          )}
                        </div>
                      )}
                      {error && (
                        <div aria-live="assertive" className="animate-fade-in rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={busy || (email === lastEmail && cooldown > 0)}
                        className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25 active:scale-[0.99] disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                      >
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        <span className="relative flex items-center gap-2">
                          {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
                          Send reset link
                        </span>
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="mb-6 flex rounded-2xl border border-border bg-muted p-1 text-sm font-medium">
                      {(["signup", "signin"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={mode === m}
                          onClick={() => {
                            setMode(m);
                            if (m === "signup") setSignUpSuccess(false);
                          }}
                          className={`flex-1 rounded-xl py-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none ${
                            mode === m
                              ? "bg-card text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {m === "signup" ? "Get started" : "Sign in"}
                        </button>
                      ))}
                    </div>


                    <h2 className="font-display text-2xl font-bold tracking-tight">
                      {mode === "signup" ? "Create your account" : "Welcome back"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {mode === "signup"
                        ? "Free forever. No credit card required."
                        : "Sign in to access your orders and pricing."}
                    </p>

                    <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
                      <div>
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-muted-foreground">
                            Work email
                          </span>
                          <div className="group relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" aria-hidden="true" />
                            <input
                              type="email"
                              autoComplete="email"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                if (fieldErrors.email) validateField("email", e.target.value);
                              }}
                              onBlur={() => {
                                setTouched((t) => ({ ...t, email: true }));
                                validateField("email", email);
                              }}
                              className={`${inputBase} ${fieldErrors.email ? inputError : inputNormal}`}
                              placeholder="jane@acme.com"
                              aria-invalid={!!fieldErrors.email}
                              aria-describedby={fieldErrors.email ? "email-error" : undefined}
                            />
                            {fieldErrors.email && (
                              <AlertCircle className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-destructive" aria-hidden="true" />
                            )}
                          </div>
                        </label>
                        {fieldErrors.email && (
                          <p id="email-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive animate-fade-in">
                            <AlertCircle className="size-3.5" aria-hidden="true" />
                            {fieldErrors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-muted-foreground">
                            Password
                          </span>
                          <div className="group relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" aria-hidden="true" />
                            <input
                              type={showPassword ? "text" : "password"}
                              autoComplete={mode === "signup" ? "new-password" : "current-password"}
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (fieldErrors.password) validateField("password", e.target.value);
                              }}
                              onBlur={() => {
                                setTouched((t) => ({ ...t, password: true }));
                                validateField("password", password);
                              }}
                              className={`${passwordInputBase} ${fieldErrors.password ? inputError : inputNormal}`}
                              placeholder="At least 6 characters"
                              aria-invalid={!!fieldErrors.password}
                              aria-describedby={fieldErrors.password ? "password-error" : undefined}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                            </button>
                          </div>
                        </label>
                        {fieldErrors.password && (
                          <p id="password-error" className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive animate-fade-in">
                            <AlertCircle className="size-3.5" aria-hidden="true" />
                            {fieldErrors.password}
                          </p>
                        )}
                      </div>

                      {mode === "signin" && (
                        <div className="flex items-center justify-between">
                          <label className="inline-flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="size-4 rounded border-border bg-input/50 text-primary accent-primary outline-none focus:ring-2 focus:ring-ring/20"
                            />
                            <span className="text-sm text-muted-foreground">Remember me</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setMode("forgot")}
                            className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}


                      {error && (
                        <div aria-live="assertive" className="animate-fade-in rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                          {error}
                        </div>
                      )}
                      {signUpSuccess && mode === "signin" && (
                        <div aria-live="polite" className="animate-fade-in rounded-xl border border-emerald/30 bg-emerald/10 p-4 text-sm text-emerald-foreground">
                          <div className="flex items-start gap-3">
                            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald/20" aria-hidden="true">
                              <Mail className="size-4" aria-hidden="true" />
                            </div>
                            <div>
                              <p className="font-semibold">Confirm your email</p>
                              <p className="mt-0.5 text-emerald-foreground/80">
                                We sent a confirmation link to <span className="font-medium">{email}</span>. Click it to activate your account, then sign in below.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {info && !signUpSuccess && (
                        <div aria-live="polite" className="animate-fade-in rounded-lg border border-emerald/30 bg-emerald/10 px-3 py-2 text-sm text-emerald-foreground">
                          {info}
                        </div>
                      )}


                      <button
                        type="submit"
                        disabled={busy}
                        className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25 active:scale-[0.99] disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                      >
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                        <span className="relative flex items-center gap-2">
                          {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
                          {mode === "signup" ? "Create account" : "Sign in"}
                        </span>
                      </button>
                    </form>
                  </>
                )}

                <p className="mt-6 text-center text-xs text-muted-foreground/70">
                  256-bit encrypted · GDPR · No spam
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
