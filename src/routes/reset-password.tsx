import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password | LyraData" },
      { name: "description", content: "Set a new password for your LyraData account." },
    ],
  }),
  component: ResetPasswordPage,
});

const passwordSchema = z.object({
  password: z.string().min(6, { message: "At least 6 characters" }).max(72),
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const type = params.get("type");
    const accessToken = params.get("access_token");
    setRecovery(type === "recovery" && !!accessToken);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = passwordSchema.safeParse({ password });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

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

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <div className="relative mx-auto w-full">
          <div
            className="relative animate-fade-in rounded-[1.75rem] border border-border bg-card/80 p-8 shadow-xl backdrop-blur-xl"
            style={{ backdropFilter: "blur(24px) saturate(140%)" }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]">
              <div className="absolute -top-1/2 left-0 h-full w-full rotate-12 bg-gradient-to-b from-white/60 via-transparent to-transparent opacity-50" />
            </div>

            <div className="relative">
              <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-bold tracking-tight text-foreground">
                <span className="grid size-6 place-items-center rounded-md bg-primary">
                  <span className="size-2 rounded-full bg-primary-foreground" />
                </span>
                LYRA<span className="text-muted-foreground">DATA</span>
              </Link>

              {!recovery ? (
                <div className="mt-8 space-y-4">
                  <div aria-live="polite" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <p className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      This password reset link is invalid or expired. Please request a new one.
                    </p>
                  </div>
                  <Link
                    to="/auth"
                    search={{ mode: "forgot" }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                  >
                    Request a new reset link <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : success ? (
                <div className="mt-8 space-y-6">
                  <div aria-live="polite" className="rounded-lg border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm text-emerald-foreground">
                    <p className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      Your password has been updated successfully.
                    </p>
                  </div>
                  <Link
                    to="/auth"
                    search={{ mode: "signin" }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                  >
                    Sign in with new password <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="mt-6 font-display text-2xl font-bold tracking-tight">Reset your password</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-muted-foreground">New password</span>
                      <div className="group relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                        <input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-xl border border-border bg-input/50 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-primary/40 focus:bg-background focus:ring-2 focus:ring-ring/20"
                          placeholder="At least 6 characters"
                          aria-invalid={!!error}
                          aria-describedby={error ? "password-error" : undefined}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </label>

                    {error && (
                      <div id="password-error" aria-live="assertive" className="animate-fade-in rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {error}
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
                        Update password
                      </span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
