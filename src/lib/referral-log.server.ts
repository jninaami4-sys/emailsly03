// Structured logs for referral flows. Server-only.
// Emits single-line JSON so Cloudflare Worker logs stay greppable
// (`server-function-logs --search referral`) in dev and prod.

type ReferralEvent =
  | "referral.balance.fetch"
  | "referral.summary.fetch"
  | "referral.attach"
  | "referral.credit.redeem"
  | "referral.credit.ledger_write";

type Status = "start" | "ok" | "error";

export type ReferralLogFields = {
  event: ReferralEvent;
  status: Status;
  user_id?: string | null;
  order_id?: string | null;
  requested_cents?: number;
  spent_cents?: number;
  balance_cents?: number;
  subtotal_cents?: number;
  code?: string | null;
  duration_ms?: number;
  error_code?: string | null;
  error_message?: string | null;
  rls_hint?: boolean;
  [key: string]: unknown;
};

function classifyError(err: unknown): { code: string | null; message: string; rls_hint: boolean } {
  if (!err) return { code: null, message: "unknown", rls_hint: false };
  const anyErr = err as { code?: string; message?: string; hint?: string; details?: string };
  const message = anyErr.message ?? String(err);
  const code = anyErr.code ?? null;
  // PostgREST/pg codes we care about most for this domain:
  // - 42501 = insufficient_privilege (missing GRANT)
  // - PGRST301 / "permission denied" = Data API denial
  // - RLS denials surface as "new row violates row-level security policy" or code 42501
  const lower = `${code ?? ""} ${message}`.toLowerCase();
  const rls_hint =
    lower.includes("row-level security") ||
    lower.includes("permission denied") ||
    code === "42501" ||
    code === "PGRST301";
  return { code, message, rls_hint };
}

export function logReferral(fields: ReferralLogFields): void {
  try {
    const payload = { scope: "referral", ts: new Date().toISOString(), ...fields };
    const line = JSON.stringify(payload);
    if (fields.status === "error") console.error(line);
    else console.log(line);
  } catch {
    // Never let logging break a request.
  }
}

export async function withReferralLog<T>(
  event: ReferralEvent,
  base: Omit<ReferralLogFields, "event" | "status" | "duration_ms">,
  fn: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  logReferral({ event, status: "start", ...base });
  try {
    const result = await fn();
    logReferral({
      event,
      status: "ok",
      duration_ms: Date.now() - started,
      ...base,
    });
    return result;
  } catch (err) {
    const { code, message, rls_hint } = classifyError(err);
    logReferral({
      event,
      status: "error",
      duration_ms: Date.now() - started,
      error_code: code,
      error_message: message,
      rls_hint,
      ...base,
    });
    throw err;
  }
}

export { classifyError as classifyReferralError };
