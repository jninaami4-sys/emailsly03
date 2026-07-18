import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCampaigns, upsertCampaign, deleteCampaign, sendCampaign, previewCampaignAudience } from "@/lib/admin-extras.functions";
import { Plus, Save, Trash2, Loader2, Megaphone } from "@/components/admin/AdminIcons";

type Campaign = {
  id: string;
  name: string;
  subject: string | null;
  body: string;
  audience: string;
  audience_filter: any;
  channel: string;
  status: string;
  sent_at: string | null;
  recipient_count: number;
};

const empty = {
  id: null as string | null,
  name: "",
  subject: "",
  body: "",
  audience: "all" as "all" | "paid" | "by_service",
  audience_filter: {} as any,
  channel: "email" as "email" | "announcement",
  status: "draft" as const,
};

export function CampaignsAdmin() {
  const qc = useQueryClient();
  const listFn = useServerFn(listCampaigns);
  const upFn = useServerFn(upsertCampaign);
  const delFn = useServerFn(deleteCampaign);
  const sendFn = useServerFn(sendCampaign);
  const previewFn = useServerFn(previewCampaignAudience);
  const [draft, setDraft] = useState(empty);
  const [msg, setMsg] = useState<string | null>(null);
  const [audiencePreview, setAudiencePreview] = useState<{ count: number; sample: string[] } | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-campaigns"], queryFn: () => listFn() });
  const save = useMutation({
    mutationFn: () => upFn({ data: draft as any }),
    onSuccess: () => {
      setDraft(empty);
      qc.invalidateQueries({ queryKey: ["admin-campaigns"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-campaigns"] }),
  });
  const send = useMutation({
    mutationFn: (id: string) => sendFn({ data: { id } }),
    onSuccess: (r) => {
      setMsg(`✅ Queued for ${r.recipients < 0 ? "site-wide" : r.recipients} recipient(s).`);
      qc.invalidateQueries({ queryKey: ["admin-campaigns"] });
    },
    onError: (e) => setMsg(`❌ ${(e as Error).message}`),
  });
  const preview = useMutation({
    mutationFn: () => previewFn({ data: { audience: draft.audience, audience_filter: draft.audience_filter } }),
    onSuccess: (r) => setAudiencePreview(r),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-lg font-black">Campaigns</h3>
        <p className="mt-1 text-sm text-muted-foreground">Broadcast email or in-app announcements to targeted audiences.</p>
        {msg && <div className="mt-3 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold">{msg}</div>}
        <div className="mt-4 divide-y divide-border">
          {isLoading && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
          {data?.campaigns?.map((c: Campaign) => (
            <div key={c.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Megaphone className="size-4 text-primary" />
                  <span className="truncate font-semibold">{c.name}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${c.status === "sent" ? "bg-emerald-soft text-emerald" : "bg-secondary text-muted-foreground"}`}>{c.status}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {c.channel} · {c.audience} · {c.recipient_count || 0} recipients
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {c.status !== "sent" && (
                  <button
                    onClick={() => confirm(`Send campaign "${c.name}" now?`) && send.mutate(c.id)}
                    disabled={send.isPending}
                    className="rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground disabled:opacity-50"
                  >
                    Send
                  </button>
                )}
                <button
                  onClick={() =>
                    setDraft({
                      id: c.id,
                      name: c.name,
                      subject: c.subject ?? "",
                      body: c.body ?? "",
                      audience: c.audience as any,
                      audience_filter: c.audience_filter ?? {},
                      channel: c.channel as any,
                      status: "draft" as const,
                    })
                  }
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-bold"
                >
                  Edit
                </button>
                <button
                  onClick={() => confirm("Delete this campaign?") && remove.mutate(c.id)}
                  className="rounded-lg border border-border bg-background p-1.5 text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
          {!isLoading && !data?.campaigns?.length && <div className="p-6 text-center text-sm text-muted-foreground">No campaigns yet.</div>}
        </div>
      </section>

      <aside className="rounded-2xl border border-border bg-card p-4">
        <h3 className="font-display text-lg font-black">{draft.id ? "Edit campaign" : "New campaign"}</h3>
        <div className="mt-4 space-y-3">
          <Field label="Name (internal)">
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={input} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel">
              <select value={draft.channel} onChange={(e) => setDraft({ ...draft, channel: e.target.value as any })} className={input}>
                <option value="email">Email</option>
                <option value="announcement">In-app announcement</option>
              </select>
            </Field>
            <Field label="Audience">
              <select
                value={draft.audience}
                onChange={(e) => {
                  setDraft({ ...draft, audience: e.target.value as any });
                  setAudiencePreview(null);
                }}
                className={input}
              >
                <option value="all">All users</option>
                <option value="paid">Paid customers</option>
                <option value="by_service">By service</option>
              </select>
            </Field>
          </div>
          {draft.audience === "by_service" && (
            <Field label="Service label contains">
              <input
                value={draft.audience_filter?.service_label ?? ""}
                onChange={(e) => setDraft({ ...draft, audience_filter: { ...draft.audience_filter, service_label: e.target.value } })}
                className={input}
                placeholder="Apollo"
              />
            </Field>
          )}
          <button
            type="button"
            onClick={() => preview.mutate()}
            disabled={preview.isPending}
            className="text-xs font-bold text-primary underline underline-offset-2 disabled:opacity-50"
          >
            {preview.isPending ? "Counting…" : "Preview audience"}
          </button>
          {audiencePreview && (
            <div className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs">
              <strong>{audiencePreview.count}</strong> recipient{audiencePreview.count === 1 ? "" : "s"}
              {audiencePreview.sample.length > 0 && <> · sample: {audiencePreview.sample.slice(0, 3).join(", ")}…</>}
            </div>
          )}
          {draft.channel === "email" && (
            <Field label="Subject">
              <input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} className={input} />
            </Field>
          )}
          <Field label={draft.channel === "email" ? "HTML body" : "Message"}>
            <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className={input} rows={8} />
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            disabled={!draft.name || !draft.body || save.isPending}
            onClick={() => save.mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : draft.id ? <Save className="size-4" /> : <Plus className="size-4" />}
            {draft.id ? "Save draft" : "Create draft"}
          </button>
          {draft.id && (
            <button onClick={() => setDraft(empty)} className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold">
              Cancel
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
