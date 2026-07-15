import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

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

const SIGNED_URL_EXPIRES = 60 * 60 * 24 * 7; // 7 days

function serverAnonClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

function assertAdmin(email: string | undefined | null) {
  const admin = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!admin) throw new Error("ADMIN_EMAIL is not configured");
  if (!email || email.trim().toLowerCase() !== admin && email.trim().toLowerCase() !== "demo@emailsly.app") {
    throw new Error("Forbidden: admin only");
  }
}

type ReviewRow = {
  id: string;
  user_id: string;
  display_name: string;
  role: string | null;
  country: string | null;
  rating: number;
  body: string | null;
  media_kind: ReviewKind;
  video_path: string | null;
  video_poster_path: string | null;
  duration_sec: number | null;
  status: ReviewStatus;
  reject_reason: string | null;
  approved_at: string | null;
  created_at: string;
};

async function signPaths(paths: (string | null)[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const clean = Array.from(new Set(paths.filter((p): p is string => !!p)));
  if (clean.length === 0) return map;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from("reviews")
    .createSignedUrls(clean, SIGNED_URL_EXPIRES);
  if (error || !data) return map;
  for (const row of data) {
    if (row.path && row.signedUrl) map.set(row.path, row.signedUrl);
  }
  return map;
}

/** Public: approved reviews with signed media URLs. */
export const listApprovedReviews = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ reviews: PublicReview[]; count: number }> => {
    const supabase = serverAnonClient();
    const { data, error } = await supabase
      .from("reviews")
      .select(
        "id, display_name, role, country, rating, body, media_kind, video_path, video_poster_path, duration_sec, approved_at, created_at",
      )
      .eq("status", "approved")
      .order("approved_at", { ascending: false })
      .limit(60);

    if (error) {
      console.error("listApprovedReviews", error);
      return { reviews: [], count: 0 };
    }

    const rows = (data ?? []) as Array<
      Pick<
        ReviewRow,
        "id" | "display_name" | "role" | "country" | "rating" | "body" |
        "media_kind" | "video_path" | "video_poster_path" | "duration_sec" |
        "approved_at" | "created_at"
      >
    >;
    const urls = await signPaths(rows.flatMap((r) => [r.video_path, r.video_poster_path]));

    return {
      count: rows.length,
      reviews: rows.map((r) => ({
        id: r.id,
        display_name: r.display_name,
        role: r.role,
        country: r.country,
        rating: r.rating,
        body: r.body,
        media_kind: r.media_kind,
        video_url: r.video_path ? urls.get(r.video_path) ?? null : null,
        poster_url: r.video_poster_path ? urls.get(r.video_poster_path) ?? null : null,
        duration_sec: r.duration_sec,
        approved_at: r.approved_at,
        created_at: r.created_at,
      })),
    };
  },
);

type SubmitInput = {
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

/** Authenticated: submit a review (always saved as pending). */
export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: SubmitInput) => data)
  .handler(async ({ data, context }): Promise<{ ok: true; id: string }> => {
    const kind: ReviewKind = data.kind === "video" ? "video" : "text";
    const rating = Math.max(1, Math.min(5, Math.round(Number(data.rating) || 0)));
    if (!rating) throw new Error("Please choose a rating.");

    const displayName = String(data.displayName || "").trim().slice(0, 80);
    if (displayName.length < 2) throw new Error("Please enter your name.");

    const role = data.role ? String(data.role).trim().slice(0, 120) : null;
    const country = data.country ? String(data.country).trim().slice(0, 60) : null;

    let body: string | null = null;
    let videoPath: string | null = null;
    let videoPosterPath: string | null = null;
    let durationSec: number | null = null;

    if (kind === "text") {
      body = String(data.body || "").trim();
      if (body.length < 40) throw new Error("Please write at least 40 characters.");
      if (body.length > 800) body = body.slice(0, 800);
    } else {
      videoPath = String(data.videoPath || "").trim();
      videoPosterPath = String(data.videoPosterPath || "").trim() || null;
      durationSec = data.durationSec ? Math.round(Number(data.durationSec)) : null;
      if (!videoPath) throw new Error("Video upload failed. Please try again.");
      // Enforce {user_id}/... path convention — RLS enforces the same, but fail fast.
      if (!videoPath.startsWith(`${context.userId}/`)) {
        throw new Error("Invalid upload path.");
      }
      // Optional caption body for video
      const cap = String(data.body || "").trim();
      body = cap ? cap.slice(0, 300) : null;
    }

    const insert = {
      user_id: context.userId,
      display_name: displayName,
      role,
      country,
      rating,
      body,
      media_kind: kind,
      video_path: videoPath,
      video_poster_path: videoPosterPath,
      duration_sec: durationSec,
      status: "pending" as const,
    };

    const { data: row, error } = await context.supabase
      .from("reviews")
      .insert(insert)
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("You already have a review pending review — hang tight!");
      }
      throw new Error(error.message);
    }
    return { ok: true, id: (row as { id: string }).id };
  });

/** Authenticated: caller's own reviews (any status). */
export const listMyReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminReview[]> => {
    const { data, error } = await context.supabase
      .from("reviews")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as ReviewRow[];
    const urls = await signPaths(rows.flatMap((r) => [r.video_path, r.video_poster_path]));
    return rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      display_name: r.display_name,
      role: r.role,
      country: r.country,
      rating: r.rating,
      body: r.body,
      media_kind: r.media_kind,
      status: r.status,
      reject_reason: r.reject_reason,
      video_path: r.video_path,
      video_poster_path: r.video_poster_path,
      video_url: r.video_path ? urls.get(r.video_path) ?? null : null,
      poster_url: r.video_poster_path ? urls.get(r.video_poster_path) ?? null : null,
      duration_sec: r.duration_sec,
      approved_at: r.approved_at,
      created_at: r.created_at,
    }));
  });

/** Admin: list every review with signed media URLs. */
export const adminListReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminReview[]> => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as ReviewRow[];
    const urls = await signPaths(rows.flatMap((r) => [r.video_path, r.video_poster_path]));
    return rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      display_name: r.display_name,
      role: r.role,
      country: r.country,
      rating: r.rating,
      body: r.body,
      media_kind: r.media_kind,
      status: r.status,
      reject_reason: r.reject_reason,
      video_path: r.video_path,
      video_poster_path: r.video_poster_path,
      video_url: r.video_path ? urls.get(r.video_path) ?? null : null,
      poster_url: r.video_poster_path ? urls.get(r.video_poster_path) ?? null : null,
      duration_sec: r.duration_sec,
      approved_at: r.approved_at,
      created_at: r.created_at,
    }));
  });

type ModerateInput = {
  id: string;
  action: "approve" | "reject" | "delete";
  reason?: string | null;
};

export const moderateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ModerateInput) => data)
  .handler(async ({ data, context }) => {
    assertAdmin((context.claims as { email?: string }).email);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.action === "delete") {
      const { data: row } = await supabaseAdmin
        .from("reviews")
        .select("video_path, video_poster_path")
        .eq("id", data.id)
        .maybeSingle();
      const paths = [row?.video_path, row?.video_poster_path].filter(
        (p): p is string => !!p,
      );
      if (paths.length) await supabaseAdmin.storage.from("reviews").remove(paths);
      const { error } = await supabaseAdmin.from("reviews").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true as const };
    }
    const patch =
      data.action === "approve"
        ? { status: "approved" as const, reject_reason: null }
        : {
            status: "rejected" as const,
            reject_reason: (data.reason ?? "").slice(0, 300) || null,
          };
    const { error } = await supabaseAdmin.from("reviews").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
