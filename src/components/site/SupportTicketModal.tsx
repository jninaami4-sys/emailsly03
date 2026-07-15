import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createSupportTicket } from "@/lib/support-tickets.functions";
import { X, LifeBuoy, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type Category = "payment" | "delivery" | "quality" | "refund" | "account" | "other";
type Priority = "low" | "normal" | "high" | "urgent";

const CATS: { value: Category; label: string; hint: string }[] = [
  { value: "payment", label: "Payment issue", hint: "Charge, refund, receipt" },
  { value: "delivery", label: "Delivery issue", hint: "Missing, late, wrong file" },
  { value: "quality", label: "Data quality", hint: "Bounces, wrong data" },
  { value: "refund", label: "Refund request", hint: "Ask for a refund" },
  { value: "account", label: "Account", hint: "Login, profile" },
  { value: "other", label: "Something else", hint: "General question" },
];

export function SupportTicketModal({
  open,
  onClose,
  orderId,
  orderLabel,
  defaultCategory = "other",
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  orderId?: string | null;
  orderLabel?: string;
  defaultCategory?: Category;
  onCreated?: (id: string) => void;
}) {
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [priority, setPriority] = useState<Priority>("normal");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const qc = useQueryClient();
  const createFn = useServerFn(createSupportTicket);

  useEffect(() => {
    if (open) {
      setCategory(defaultCategory);
      setPriority("normal");
      setSubject(orderLabel ? `Issue with: ${orderLabel}` : "");
      setMessage("");
    }
  }, [open, defaultCategory, orderLabel]);

  const mut = useMutation({
    mutationFn: (input: {
      order_id?: string | null;
      subject: string;
      category: Category;
      priority: Priority;
      message: string;
    }) => createFn({ data: input }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["my-support-tickets"] });
      onCreated?.(res.id);
      setTimeout(() => onClose(), 1200);
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl">
        <div className="h-1 w-full bg-gradient-to-r from-violet via-indigo to-neon-orange" />
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-violet/15 text-violet">
              <LifeBuoy className="size-5" />
            </div>
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
                Open a support ticket
              </div>
              <div className="font-display text-lg font-semibold">
                {orderLabel ? `About ${orderLabel}` : "New ticket"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (mut.isPending || mut.isSuccess) return;
            mut.mutate({
              order_id: orderId ?? null,
              subject: subject.trim() || "Support request",
              category,
              priority,
              message: message.trim(),
            });
          }}
          className="grid gap-4 px-5 py-5"
        >
          <div>
            <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    category === c.value
                      ? "border-violet bg-violet/10 shadow-sm"
                      : "border-border bg-card hover:border-violet/40"
                  }`}
                >
                  <div className="text-sm font-semibold">{c.label}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{c.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              required
              className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-violet focus:outline-none"
              placeholder="Brief summary"
            />
          </div>

          <div className="grid gap-2">
            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Priority
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(["low", "normal", "high", "urgent"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                    priority === p
                      ? "border-violet bg-violet text-white"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Describe the issue
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              minLength={5}
              maxLength={4000}
              required
              className="resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm focus:border-violet focus:outline-none"
              placeholder="Include what happened, what you expected, and any details that help us fix it quickly."
            />
            <div className="text-right font-mono text-[10px] text-muted-foreground">
              {message.length}/4000
            </div>
          </div>

          {mut.isError && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{(mut.error as Error)?.message ?? "Failed to open ticket."}</span>
            </div>
          )}
          {mut.isSuccess && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald/30 bg-emerald/10 p-3 text-sm text-emerald">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>Ticket opened. Our team will reply here and by email.</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mut.isPending || mut.isSuccess || message.trim().length < 5}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet to-indigo px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet/25 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : <LifeBuoy className="size-4" />}
              {mut.isPending ? "Opening…" : "Open ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
