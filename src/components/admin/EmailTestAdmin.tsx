import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Mail } from "@/components/admin/AdminIcons";

type Channel = "auth" | "orders" | "support" | "contact" | "all";

type Result = {
  channel: string;
  from?: string;
  host?: string;
  ok: boolean;
  ms?: number;
  error?: string;
};

const CHANNELS: { id: Channel; label: string; hint: string }[] = [
  { id: "all", label: "All senders", hint: "Fires one test per configured channel." },
  { id: "auth", label: "Auth · no-reply@", hint: "Password reset & verification sender." },
  { id: "orders", label: "Orders · orders@", hint: "Order confirmations to customer & admin." },
  { id: "support", label: "Support · support@", hint: "Ticket receipts & replies." },
  { id: "contact", label: "Contact · hello@", hint: "Inbound contact form auto-reply." },
];

export function EmailTestAdmin() {
  const [channel, setChannel] = useState<Channel>("all");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("Emailsly SMTP test");
  const [message, setMessage] = useState(
    "This is a test email fired from the Emailsly admin panel to confirm SMTP delivery and template rendering.",
  );
  const [html, setHtml] = useState(true);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setError(null);
    setResults(null);
    if (!/^\S+@\S+\.\S+$/.test(to)) {
      setError("Enter a valid recipient email address.");
      return;
    }
    setSending(true);
    try {
      const res = await api<{ to: string; results: Result[] }>(
        "/api/admin/test-email",
        { method: "POST", body: { channel, to, subject, message, html } },
      );
      setResults(res.results);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Test send failed.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="admin-glow-card p-6">
        <div className="flex items-start gap-4">
          <div className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/5">
            <Mail className="size-5 text-[#facc15]" />
          </div>
          <div>
            <h2 className="admin-title text-2xl font-semibold">Email diagnostics</h2>
            <p className="mt-1 text-sm text-white/70">
              Fire a live test email through any SMTP sender to confirm cPanel
              credentials, TLS handshake, and template rendering.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* Form */}
        <div className="admin-glow-card space-y-5 p-6">
          <div>
            <label className="mb-2 block font-mono text-[11px] font-bold uppercase tracking-widest text-white/60">
              SMTP channel
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {CHANNELS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChannel(c.id)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    channel === c.id
                      ? "border-[#facc15]/60 bg-[#facc15]/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/80 hover:border-white/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="font-semibold">{c.label}</div>
                  <div className="mt-0.5 text-[11px] text-white/50">{c.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-widest text-white/60">
                Send to
              </span>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#facc15]/60 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-widest text-white/60">
                Subject
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-[#facc15]/60 focus:outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block font-mono text-[11px] font-bold uppercase tracking-widest text-white/60">
              Message (optional)
            </span>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-[#facc15]/60 focus:outline-none"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={html}
              onChange={(e) => setHtml(e.target.checked)}
              className="size-4 rounded border-white/20 bg-black/40"
            />
            Send as branded HTML template
          </label>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={send}
              disabled={sending || !to}
              className="inline-flex items-center gap-2 rounded-lg bg-[#facc15] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#fde047] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send test email"}
            </button>
            {error && <span className="text-sm text-[#f87171]">{error}</span>}
          </div>
        </div>

        {/* Results */}
        <div className="admin-glow-card p-6">
          <h3 className="admin-title text-lg font-semibold">Delivery log</h3>
          <p className="mt-1 text-xs text-white/50">
            Live results from the last test. Any failure logs the SMTP error
            server-side (check PHP error log on cPanel).
          </p>
          <div className="mt-4 space-y-2">
            {!results && (
              <div className="rounded-lg border border-dashed border-white/10 p-4 text-sm text-white/40">
                No tests fired yet.
              </div>
            )}
            {results?.map((r) => (
              <div
                key={r.channel}
                className={`rounded-lg border p-3 text-sm ${
                  r.ok
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block size-2 rounded-full ${
                        r.ok ? "bg-emerald-400" : "bg-red-400"
                      }`}
                    />
                    <span className="font-semibold text-white">{r.channel}</span>
                    <span className="text-white/50">·</span>
                    <span className="font-mono text-[11px] text-white/60">
                      {r.ok ? "delivered to relay" : "failed"}
                    </span>
                  </div>
                  {r.ms != null && (
                    <span className="font-mono text-[11px] text-white/50">
                      {r.ms}ms
                    </span>
                  )}
                </div>
                <div className="mt-1.5 space-y-0.5 font-mono text-[11px] text-white/60">
                  {r.from && <div>from: {r.from}</div>}
                  {r.host && <div>host: {r.host}</div>}
                  {r.error && <div className="text-[#fca5a5]">error: {r.error}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}