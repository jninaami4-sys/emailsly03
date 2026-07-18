// PHP-backed proxies. Same export names as before; now plain async functions.
import { reviewsApi, adminReviewsApi } from "@/lib/api-client";

export type ReviewStatus = "pending" | "approved" | "rejected";
export type ReviewKind = "text" | "video";

export type PublicReview = {
  id: string;
  display_name: string;
  role: string | null;
  country: string | null;
  rating: number;
  body: string | null;
  media_kind: ReviewKind;
  video_url: string | null;
  poster_url: string | null;
  duration_sec: number | null;
  approved_at: string | null;
  created_at: string;
};

export type AdminReview = PublicReview & {
  user_id: string;
  status: ReviewStatus;
  reject_reason: string | null;
  video_path: string | null;
  video_poster_path: string | null;
};

export async function listApprovedReviews(): Promise<{ reviews: PublicReview[]; count: number }> {
  try {
    const res = await reviewsApi.list();
    return {
      reviews: (res.reviews ?? []) as PublicReview[],
      count: res.count ?? (res.reviews?.length ?? 0),
    };
  } catch {
    return { reviews: [], count: 0 };
  }
}

export type SubmitReviewInput = {
  kind: ReviewKind;
  rating: number;
  body?: string | null;
  displayName: string;
  role?: string | null;
  country?: string | null;
  videoPath?: string | null;
  videoPosterPath?: string | null;
  durationSec?: number | null;
};

export async function submitReview(input: SubmitReviewInput): Promise<{ ok: true; id: string }> {
  const kind: ReviewKind = input.kind === "video" ? "video" : "text";
  const rating = Math.max(1, Math.min(5, Math.round(Number(input.rating) || 0)));
  if (!rating) throw new Error("Please choose a rating.");
  const displayName = String(input.displayName || "").trim().slice(0, 80);
  if (displayName.length < 2) throw new Error("Please enter your name.");
  const payload = {
    kind,
    rating,
    display_name: displayName,
    role: input.role ? String(input.role).trim().slice(0, 120) : null,
    country: input.country ? String(input.country).trim().slice(0, 60) : null,
    body: input.body ? String(input.body).trim().slice(0, kind === "text" ? 800 : 300) : null,
    video_path: input.videoPath ?? null,
    video_poster_path: input.videoPosterPath ?? null,
    duration_sec: input.durationSec ?? null,
  };
  if (kind === "text" && (!payload.body || payload.body.length < 40)) {
    throw new Error("Please write at least 40 characters.");
  }
  if (kind === "video" && !payload.video_path) {
    throw new Error("Video upload failed. Please try again.");
  }
  const { id } = await reviewsApi.submit(payload);
  return { ok: true, id };
}

export async function listMyReviews(): Promise<AdminReview[]> {
  const { reviews } = await reviewsApi.listMine();
  return (reviews ?? []) as AdminReview[];
}

export async function adminListReviews(): Promise<AdminReview[]> {
  const { reviews } = await adminReviewsApi.list();
  return (reviews ?? []) as AdminReview[];
}

export type ModerateInput = {
  id: string;
  action: "approve" | "reject" | "delete";
  reason?: string | null;
};

export async function moderateReview(input: ModerateInput): Promise<{ ok: true }> {
  await adminReviewsApi.moderate(input.id, { action: input.action, reason: input.reason ?? null });
  return { ok: true };
}
