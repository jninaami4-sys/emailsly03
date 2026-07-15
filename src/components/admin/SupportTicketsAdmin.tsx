import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListSupportTickets,
  adminGetSupportTicket,
  adminReplySupportTicket,
  adminUpdateSupportTicket,
  type SupportTicketStatus,
} from "@/lib/support-tickets.functions";
import { Loader2, LifeBuoy, Send, X, ChevronLeft, Search } from "lucide-react";

const STATUSES: (SupportTicketStatus | "all")[] = [
  "all",
  "open",
  "in_progress",
  "waiting_customer",
  "resolved",
  "closed",
];

const STATUS_STYLES: Record<string, string> = {
  open: "bg-neon-orange/15 text-neon-orange border-neon-orange/30",
  in_progress: "bg-violet/15 text-violet border-violet/30",
  waiting_customer: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  resolved: "bg-emerald/15 text-emerald border-emerald/30",
  closed: "bg-muted text-muted-foreground border-border",
};

export function SupportTicketsAdmin() {
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const listFn = useServerFn(adminListSupportTickets);

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-support-tickets", status, search],
    queryFn: () => listFn({ data: { status, search } }),
    retry: false,
  });

  const stats = useMemo(() => {
    const s: Record<string, number> = { open: 0, in_progress: 0, waiting_customer: 0 };
    for (const t of data as any[]) s[t.status] = (s[t.status] ?? 0) + 1;
    return s;
  }, [data]);

  return (
    <section className="mt-10 rounded-2xl border border-border bg-card/60 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-violet/15 text-violet">
            <LifeBuoy className="size-5" />
          </div>
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              Support tickets
            </div>
            <h2 className="font-display text-lg font-semibold">Customer issues</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Pill tone="orange">{stats.open ?? 0} open</Pill>
          <Pill tone="violet">{stats.in_progress ?? 0} in progress</Pill>
          <Pill tone="amber">{stats.waiting_customer ?? 0} awaiting customer</Pill>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or subject…"
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-violet focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-background p-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition ${
                status === s ? "bg-violet text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="size-6 animate-spin text-violet" />
        </div>
      ) : data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No tickets match this filter.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {(data as any[]).map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setOpenId(t.id)}
                  className="cursor-pointer border-t border-border transition-colors hover:bg-secondary/50"
                >
                  <td className="max-w-xs truncate px-3 py-2 font-medium">{t.subject}</td>
                  <td className="px-3 py-2 text-muted-foreground">{t.email}</td>
                  <td className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider">
                    {t.category}
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider">
                    {t.priority}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                        STATUS_STYLES[t.status] ?? ""
                      }`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(t.last_message_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openId && (
        <AdminTicketDrawer
          id={openId}
          onClose={() => {
            setOpenId(null);
            refetch();
          }}
        />
      )}
    </section>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: "orange" | "violet" | "amber" }) {
  const c =
    tone === "orange"
      ? "bg-neon-orange/15 text-neon-orange"
      : tone === "violet"
        ? "bg-violet/15 text-violet"
        : "bg-amber-500/15 text-amber-500";
  return (
    <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${c}`}>
      {children}
    </span>
  );
}

function AdminTicketDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const getFn = useServerFn(adminGetSupportTicket);
  const replyFn = useServerFn(adminReplySupportTicket);
  const updateFn = useServerFn(adminUpdateSupportTicket);
  const [body, setBody] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-support-ticket", id],
    queryFn: () => getFn({ data: { id } }),
    refetchInterval: 20000,
  });

  const reply = useMutation({
    mutationFn: (input: { body: string; status?: SupportTicketStatus }) =>
      replyFn({ data: { ticket_id: id, body: input.body, status: input.status } }),
    onSuccess: () => {
      setBody("");
      refetch();
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
  });

  const update = useMutation({
    mutationFn: (input: { status?: SupportTicketStatus; priority?: string }) =>
      updateFn({ data: { id, ...input } as any }),
    onSuccess: () => {
      refetch();
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
  });

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-black/70 backdrop-blur-sm">
      <div className="flex h-full w-full flex-col bg-background sm:max-w-2xl sm:border-l sm:border-border">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground sm:hidden"
          >
            <ChevronLeft className="size-4" /> Back
          </button>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet">
              {data?.ticket?.email ?? "…"}
            </div>
            <div className="mt-0.5 truncate font-display text-lg font-semibold">
              {data?.ticket?.subject ?? "Loading…"}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono uppercase tracking-wider">
                {data?.ticket?.category} · {data?.ticket?.priority}
              </span>
              {data?.ticket?.order_id && (
                <span className="font-mono">
                  · order {String(data.ticket.order_id).slice(0, 8)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="hidden rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground sm:block"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Status controls */}
        {data?.ticket && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Set status:
            </span>
            {(["open", "in_progress", "waiting_customer", "resolved", "closed"] as SupportTicketStatus[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => update.mutate({ status: s })}
                  disabled={update.isPending || data.ticket.status === s}
                  className={`rounded-lg border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition ${
                    data.ticket.status === s
                      ? "border-violet bg-violet text-white"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  } disabled:cursor-not-allowed`}
                >
                  {s.replace("_", " ")}
                </button>
              ),
            )}
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="size-6 animate-spin text-violet" />
            </div>
          ) : (
            data?.messages?.map((m: any) => {
              const role = m.sender_role as "customer" | "admin" | "system";
              if (role === "system") {
                return (
                  <div
                    key={m.id}
                    className="mx-auto max-w-xs rounded-full border border-dashed border-border bg-muted/40 px-3 py-1 text-center text-[11px] text-muted-foreground"
                  >
                    {m.body}
                  </div>
                );
              }
              const isAdminMsg = role === "admin";
              return (
                <div key={m.id} className={`flex ${isAdminMsg ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                      isAdminMsg
                        ? "bg-gradient-to-br from-violet to-indigo text-white"
                        : "border border-border bg-card text-foreground"
                    }`}
                  >
                    <div className="mb-0.5 font-mono text-[9px] uppercase tracking-wider opacity-80">
                      {isAdminMsg ? "You (support)" : "Customer"} ·{" "}
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                    <div className="whitespace-pre-wrap">{m.body}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-border bg-card px-5 py-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={4000}
            placeholder="Reply to customer…"
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-violet focus:outline-none"
          />
          <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={() => reply.mutate({ body: body.trim(), status: "waiting_customer" })}
              disabled={reply.isPending || body.trim().length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-secondary disabled:opacity-50"
            >
              Send &amp; await customer
            </button>
            <button
              onClick={() => reply.mutate({ body: body.trim(), status: "resolved" })}
              disabled={reply.isPending || body.trim().length === 0}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald/40 bg-emerald/10 px-3 py-2 text-xs font-semibold text-emerald hover:bg-emerald/20 disabled:opacity-50"
            >
              Send &amp; resolve
            </button>
            <button
              onClick={() => reply.mutate({ body: body.trim() })}
              disabled={reply.isPending || body.trim().length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet to-indigo px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {reply.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Send reply
            </button>
          </div>
          {reply.isError && (
            <div className="mt-2 text-xs text-destructive">
              {(reply.error as Error)?.message ?? "Failed to send."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
