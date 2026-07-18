import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Star,
  Check,
  X,
  Trash2,
  MessageSquare,
  Video as VideoIcon,
  RefreshCw,
} from "@/components/admin/AdminIcons";
import {
  adminListReviews,
  moderateReview,
  type AdminReview,
  type ReviewStatus,
} from "@/lib/reviews.functions";

const STATUS_TABS: Array<{ key: ReviewStatus | "all"; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export function ReviewsAdmin() {
  const listFn = adminListReviews;
  const moderateFn = moderateReview;
  const [tab, setTab] = useState<ReviewStatus | "all">("pending");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: () => listFn(),
    staleTime: 15_000,
  });

  const [busy, setBusy] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function moderate(id: string, action: "approve" | "reject" | "delete", reason?: string) {
    setBusy(id);
    try {
      await moderateFn({ id, action, reason: reason ?? null });
      await refetch();
      setRejectFor(null);
      setRejectReason("");
    } finally {
      setBusy(null);
    }
  }

  const rows = (data ?? []).filter((r) => (tab === "all" ? true : r.status === tab));
  const counts = {
    pending: (data ?? []).filter((r) => r.status === "pending").length,
    approved: (data ?? []).filter((r) => r.status === "approved").length,
    rejected: (data ?? []).filter((r) => r.status === "rejected").length,
  };

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 className="font-display text-lg font-bold">Customer reviews</h2>
          <p className="text-xs text-muted-foreground">
            {counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </header>

      <div className="flex flex-wrap gap-1 border-b border-border px-2 py-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.key ? "bg-violet text-white" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t.label}
            {t.key !== "all" && counts[t.key as ReviewStatus] > 0 && (
              <span className="ml-1.5 opacity-80">({counts[t.key as ReviewStatus]})</span>
            )}
          </button>
        ))}
      </div>

      <div className="divide-y divide-border">
        {isLoading && (
          <div className="grid place-items-center py-16 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}

        {!isLoading && rows.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Nothing here yet.
          </div>
        )}

        {rows.map((r) => (
          <ReviewRow
            key={r.id}
            r={r}
            busy={busy === r.id}
            onApprove={() => moderate(r.id, "approve")}
            onDelete={() => {
              if (confirm("Delete this review permanently?")) moderate(r.id, "delete");
            }}
            onOpenReject={() => {
              setRejectFor(r.id);
              setRejectReason(r.reject_reason ?? "");
            }}
            rejectOpen={rejectFor === r.id}
            rejectReason={rejectReason}
            setRejectReason={setRejectReason}
            onSubmitReject={() => moderate(r.id, "reject", rejectReason)}
            onCancelReject={() => {
              setRejectFor(null);
              setRejectReason("");
            }}
          />
        ))}
      </div>
    </section>
  );
}

function ReviewRow(props: {
  r: AdminReview;
  busy: boolean;
  onApprove: () => void;
  onDelete: () => void;
  onOpenReject: () => void;
  rejectOpen: boolean;
  rejectReason: string;
  setRejectReason: (s: string) => void;
  onSubmitReject: () => void;
  onCancelReject: () => void;
}) {
  const { r, busy } = props;
  return (
    <div className="grid gap-4 p-4 sm:grid-cols-[220px_1fr_auto]">
      {r.media_kind === "video" ? (
        <div className="overflow-hidden rounded-lg border border-border bg-ink">
          {r.video_url ? (
            <video
              src={r.video_url}
              poster={r.poster_url ?? undefined}
              controls
              playsInline
              preload="metadata"
              className="aspect-[9/16] w-full object-cover sm:aspect-video"
            />
          ) : (
            <div className="grid aspect-video place-items-center text-xs text-muted-foreground">
              Media unavailable
            </div>
          )}
        </div>
      ) : (
        <div className="grid aspect-video w-full place-items-center rounded-lg border border-dashed border-border bg-secondary/40 text-muted-foreground">
          <MessageSquare className="size-6" />
        </div>
      )}

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display font-semibold">{r.display_name}</span>
          <StatusPill status={r.status} />
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            {r.media_kind === "video" ? (
              <>
                <VideoIcon className="size-3" /> Video
              </>
            ) : (
              <>
                <MessageSquare className="size-3" /> Text
              </>
            )}
          </span>
          <span className="flex items-center gap-0.5 text-coral">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3.5 ${i < r.rating ? "fill-current" : "text-muted-foreground/30"}`}
              />
            ))}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {[r.role, r.country].filter(Boolean).join(" · ")}
          {r.role || r.country ? " · " : ""}
          {new Date(r.created_at).toLocaleString()}
        </div>
        {r.body && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{r.body}</p>
        )}
        {r.reject_reason && (
          <p className="mt-2 rounded-md border border-coral/30 bg-coral/5 px-2 py-1 text-xs text-coral">
            Rejected: {r.reject_reason}
          </p>
        )}

        {props.rejectOpen && (
          <div className="mt-3 rounded-lg border border-border bg-secondary/40 p-3">
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Rejection reason (internal)
            </label>
            <textarea
              value={props.rejectReason}
              onChange={(e) => props.setRejectReason(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-violet"
              maxLength={300}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={props.onCancelReject}
                className="rounded-md px-3 py-1 text-xs font-semibold text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={props.onSubmitReject}
                disabled={busy}
                className="rounded-md bg-coral px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
              >
                Confirm reject
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        <button
          onClick={props.onApprove}
          disabled={busy || r.status === "approved"}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
        >
          <Check className="size-3.5" /> Approve
        </button>
        <button
          onClick={props.onOpenReject}
          disabled={busy || r.status === "rejected"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          <X className="size-3.5" /> Reject
        </button>
        <button
          onClick={props.onDelete}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-coral"
        >
          <Trash2 className="size-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ReviewStatus }) {
  const styles: Record<ReviewStatus, string> = {
    pending: "bg-amber-500/10 text-amber-600",
    approved: "bg-emerald/10 text-emerald",
    rejected: "bg-coral/10 text-coral",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}
    >
      {status}
    </span>
  );
}
