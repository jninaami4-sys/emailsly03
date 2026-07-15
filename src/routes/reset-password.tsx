import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Loader2, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, Check, X } from "lucide-react";

const searchSchema = z.object({
  redirectTo: fallback(z.string(), "").default(""),
});

// Only allow same-origin relative paths to prevent open-redirect attacks.
function sanitizeRedirect(raw: string): string | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
    if (decoded.startsWith("/login") || decoded.startsWith("/reset-password")) return null;
    return decoded;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/reset-password")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Reset your password | EmailsLy" },
      { name: "description", content: "Set a new password for your EmailsLy account." },
    ],
  }),
  component: ResetPasswordPage,
});

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "passw0rd", "12345678", "123456789",
  "qwerty123", "qwertyuiop", "iloveyou", "letmein1", "welcome1", "admin123",
  "abc12345", "monkey123", "sunshine1", "football1", "princess1", "dragon123",
]);

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .max(72, { message: "Password must be under 72 characters" })
      .regex(/[A-Z]/, { message: "Add at least one uppercase letter" })
      .regex(/[a-z]/, { message: "Add at least one lowercase letter" })
      .regex(/[0-9]/, { message: "Add at least one number" })
      .refine((v) => v === v.trim(), { message: "Password can't start or end with a space" })
      .refine((v) => !/\s{2,}/.test(v), { message: "Password can't contain consecutive spaces" })
      .refine((v) => !COMMON_PASSWORDS.has(v.toLowerCase()), {
        message: "This password is too common — choose something more unique",
      })
      .refine((v) => !/(.)\1{3,}/.test(v), {
        message: "Avoid repeating the same character 4+ times",
      }),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

type LinkState = "checking" | "valid" | "invalid" | "expired" | "used";

function getPasswordChecks(pw: string) {
  return [
    { key: "len", label: "At least 8 characters", passed: pw.length >= 8 },
    { key: "upper", label: "One uppercase letter", passed: /[A-Z]/.test(pw) },
    { key: "lower", label: "One lowercase letter", passed: /[a-z]/.test(pw) },
    { key: "num", label: "One number", passed: /[0-9]/.test(pw) },
    { key: "sym", label: "One symbol (recommended)", passed: /[^A-Za-z0-9]/.test(pw), optional: true },
  ] as const;
}

function scorePassword(pw: string) {
  const checks = getPasswordChecks(pw);
  const required = checks.filter((c) => !("optional" in c) || !c.optional);
  const passedReq = required.filter((c) => c.passed).length;
  const bonus = pw.length >= 12 ? 1 : 0;
  const sym = /[^A-Za-z0-9]/.test(pw) ? 1 : 0;
  const raw = passedReq + bonus + sym; // 0..6
  const pct = Math.min(100, Math.round((raw / 6) * 100));
  let label = "Too weak";
  let tone = "bg-destructive";
  if (raw >= 6) { label = "Strong"; tone = "bg-emerald-500"; }
  else if (raw >= 4) { label = "Good"; tone = "bg-primary"; }
  else if (raw >= 2) { label = "Weak"; tone = "bg-amber-500"; }
  return { pct, label, tone };
}

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});
  const [touched, setTouched] = useState<{ password?: boolean; confirm?: boolean }>({});
  const [success, setSuccess] = useState(false);
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const [redirectSeconds, setRedirectSeconds] = useState(3);
  const [capsLock, setCapsLock] = useState(false);
  const { redirectTo } = Route.useSearch();
  const navigate = useNavigate();
  const safeRedirect = useMemo(() => sanitizeRedirect(redirectTo), [redirectTo]);
  const isFormValid = useMemo(
    () => passwordSchema.safeParse({ password, confirm }).success,
    [password, confirm],
  );

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const errCode = params.get("error_code") || params.get("error");
    const errDesc = params.get("error_description");
    const type = params.get("type");
    const accessToken = params.get("access_token");

    if (errCode) {
      const desc = errDesc ? decodeURIComponent(errDesc.replace(/\+/g, " ")) : "";
      if (/expired/i.test(errCode) || /expired/i.test(desc)) {
        setLinkState("expired");
        setLinkMessage("This password reset link has expired.");
      } else if (/used|already/i.test(desc)) {
        setLinkState("used");
        setLinkMessage("This reset link has already been used.");
      } else {
        setLinkState("invalid");
        setLinkMessage(desc || "This password reset link is invalid.");
      }
      return;
    }

    if (type === "recovery" && accessToken) {
      setLinkState("valid");
      return;
    }

    // Fallback: PASSWORD_RECOVERY event fires if Supabase already parsed the hash.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setLinkState("valid");
    });
    const timer = window.setTimeout(() => {
      setLinkState((s) => (s === "checking" ? "invalid" : s));
    }, 1200);

    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  const checks = useMemo(() => getPasswordChecks(password), [password]);
  const strength = useMemo(() => scorePassword(password), [password]);

  function validate(field?: "password" | "confirm") {
    const parsed = passwordSchema.safeParse({ password, confirm });
    const next: typeof errors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "password" | "confirm";
        if (!next[key]) next[key] = issue.message;
      }
    }
    setErrors((prev) => {
      if (field) return { ...prev, [field]: next[field], form: undefined };
      return next;
    });
    return parsed.success;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    if (!validate()) return;

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const msg = error.message || "";
        if (/same_password|different from the old|should be different/i.test(msg)) {
          setErrors({ password: "New password must be different from your current password" });
        } else if (/weak|pwned|breach|leaked/i.test(msg)) {
          setErrors({ password: "This password has appeared in a data breach — choose a different one" });
        } else if (/rate|too many|throttle/i.test(msg)) {
          setErrors({ form: "Too many attempts. Please wait a moment and try again." });
        } else if (/network|fetch|failed to fetch/i.test(msg)) {
          setErrors({ form: "Network error — check your connection and try again." });
        } else if (/expired|invalid|session|jwt|token/i.test(msg)) {
          setLinkState("expired");
          setLinkMessage("Your reset session has expired. Please request a new link.");
        } else {
          setErrors({ form: msg || "Something went wrong. Please try again." });
        }
        return;
      }
      setSuccess(true);
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  }

  const invalidLink = linkState === "invalid" || linkState === "expired" || linkState === "used";

  useEffect(() => {
    if (!success || !safeRedirect) return;
    setRedirectSeconds(3);
    const interval = window.setInterval(() => {
      setRedirectSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    const timer = window.setTimeout(() => {
      navigate({ to: safeRedirect });
    }, 3000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
    };
  }, [success, safeRedirect, navigate]);

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

              {linkState === "checking" ? (
                <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Verifying your reset link…
                </div>
              ) : invalidLink ? (
                <div className="mt-8 space-y-4">
                  <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <p className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span>
                        <strong className="block font-semibold">
                          {linkState === "expired" ? "Link expired" : linkState === "used" ? "Link already used" : "Invalid link"}
                        </strong>
                        {linkMessage ?? "This password reset link is invalid or expired."}
                      </span>
                    </p>
                  </div>
                  <Link
                    to="/login"
                    search={{ mode: "forgot" }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                  >
                    Request a new reset link <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : success ? (
                <div className="mt-8 space-y-6">
                  <div role="status" aria-live="polite" className="rounded-lg border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm text-emerald-foreground">
                    <p className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      <span>
                        Your password has been updated successfully.
                        {safeRedirect && (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            Redirecting you to <code className="font-mono">{safeRedirect}</code>
                            {redirectSeconds > 0 ? ` in ${redirectSeconds}s…` : "…"}
                          </span>
                        )}
                      </span>
                    </p>
                  </div>
                  {safeRedirect ? (
                    <button
                      type="button"
                      onClick={() => navigate({ to: safeRedirect })}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                    >
                      Continue <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      search={{ mode: "signin" }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                    >
                      Sign in with new password <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <h2 className="mt-6 font-display text-2xl font-bold tracking-tight">Reset your password</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>

                  <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
                    <div>
                      <label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-muted-foreground">
                        New password
                      </label>
                      <div className="group relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" aria-hidden="true" />
                        <input
                          id="new-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (touched.password) validate("password");
                            if (touched.confirm && confirm) validate("confirm");
                          }}
                          onBlur={() => {
                            setTouched((t) => ({ ...t, password: true }));
                            validate("password");
                            setCapsLock(false);
                          }}
                          onKeyDown={(e) => setCapsLock(e.getModifierState && e.getModifierState("CapsLock"))}
                          onKeyUp={(e) => setCapsLock(e.getModifierState && e.getModifierState("CapsLock"))}
                          className={`w-full rounded-xl border bg-input/50 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:bg-background focus:ring-2 ${
                            errors.password
                              ? "border-destructive/60 focus:border-destructive focus:ring-destructive/20"
                              : "border-border focus:border-primary/40 focus:ring-ring/20"
                          }`}
                          placeholder="Enter a strong password"
                          aria-invalid={!!errors.password}
                          aria-describedby="password-hints password-strength password-error"
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

                      {capsLock && (
                        <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500">
                          <AlertCircle className="size-3.5" aria-hidden="true" />
                          Caps Lock is on
                        </p>
                      )}

                      {/* Strength meter */}
                      <div id="password-strength" className="mt-2" aria-live="polite">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Password strength</span>
                          <span className={`font-medium ${password ? "text-foreground" : "text-muted-foreground"}`}>
                            {password ? strength.label : "—"}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full transition-all duration-300 ${strength.tone}`}
                            style={{ width: `${password ? strength.pct : 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Checklist */}
                      <ul id="password-hints" className="mt-3 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
                        {checks.map((c) => (
                          <li key={c.key} className="flex items-center gap-1.5">
                            {c.passed ? (
                              <Check className="size-3.5 text-emerald-500" aria-hidden="true" />
                            ) : (
                              <X className="size-3.5 text-muted-foreground/60" aria-hidden="true" />
                            )}
                            <span className={c.passed ? "text-foreground" : "text-muted-foreground"}>
                              {c.label}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {errors.password && touched.password && (
                        <p id="password-error" role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                          <AlertCircle className="size-3.5" aria-hidden="true" />
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-muted-foreground">
                        Confirm new password
                      </label>
                      <div className="group relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" aria-hidden="true" />
                        <input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={confirm}
                          onChange={(e) => {
                            setConfirm(e.target.value);
                            if (touched.confirm) validate("confirm");
                          }}
                          onBlur={() => {
                            setTouched((t) => ({ ...t, confirm: true }));
                            validate("confirm");
                          }}
                          className={`w-full rounded-xl border bg-input/50 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:bg-background focus:ring-2 ${
                            errors.confirm
                              ? "border-destructive/60 focus:border-destructive focus:ring-destructive/20"
                              : "border-border focus:border-primary/40 focus:ring-ring/20"
                          }`}
                          placeholder="Re-enter password"
                          aria-invalid={!!errors.confirm}
                          aria-describedby={errors.confirm ? "confirm-error" : undefined}
                        />
                        {confirm && !errors.confirm && password === confirm && (
                          <Check className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" aria-hidden="true" />
                        )}
                      </div>
                      {errors.confirm && touched.confirm && (
                        <p id="confirm-error" role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                          <AlertCircle className="size-3.5" aria-hidden="true" />
                          {errors.confirm}
                        </p>
                      )}
                    </div>

                    {errors.form && (
                      <div role="alert" className="animate-fade-in rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {errors.form}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={busy || !isFormValid}
                      aria-disabled={busy || !isFormValid}
                      className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                    >
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <span className="relative flex items-center gap-2">
                        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
                        {busy ? "Updating password…" : "Update password"}
                      </span>
                    </button>
                    {!isFormValid && (password || confirm) && !errors.password && !errors.confirm && (
                      <p className="text-center text-xs text-muted-foreground">
                        Complete all password requirements to continue
                      </p>
                    )}
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
