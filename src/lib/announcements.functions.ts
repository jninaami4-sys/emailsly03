// PHP-backed proxies. Same export names as before; now plain async functions.
import { announcementsApi, adminAnnouncementsApi } from "@/lib/api-client";
import { authApi } from "@/lib/api-client";

export type AnnouncementImageStyle = "cover" | "thumbnail" | "none";
export type AnnouncementAudience = "all" | "guests" | "authenticated" | "admins";
export type AnnouncementCardStyle = "glass" | "solid" | "gradient" | "minimal";

export type Announcement = {
  id: string;
  enabled: boolean;
  title: string;
  body: string;
  cta_label: string;
  cta_url: string;
  image_url: string;
  image_style: AnnouncementImageStyle;
  badge: string;
  accent: string;
  card_style: AnnouncementCardStyle;
  title_emoji: string;
  path_patterns: string[];
  audience: AnnouncementAudience;
  start_at: string | null;
  end_at: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
};

export async function listActiveAnnouncements(): Promise<Announcement[]> {
  try {
    const { announcements } = await announcementsApi.active();
    return (announcements ?? []) as Announcement[];
  } catch {
    return [];
  }
}

/** @deprecated kept for compat — returns the newest enabled announcement. */
export async function getActiveAnnouncement(): Promise<Announcement | null> {
  const list = await listActiveAnnouncements();
  return list[0] ?? null;
}

export async function listAnnouncements(): Promise<Announcement[]> {
  const { announcements } = await adminAnnouncementsApi.list();
  return (announcements ?? []) as Announcement[];
}

export type AnnouncementUpsertInput = {
  id?: string | null;
  enabled: boolean;
  title: string;
  body: string;
  cta_label: string;
  cta_url: string;
  image_url: string;
  image_style: AnnouncementImageStyle;
  badge: string;
  accent: string;
  card_style: AnnouncementCardStyle;
  title_emoji: string;
  path_patterns: string[];
  audience: AnnouncementAudience;
  start_at: string | null;
  end_at: string | null;
  priority: number;
};

export async function upsertAnnouncement(input: AnnouncementUpsertInput): Promise<Announcement> {
  const payload = { ...input };
  if (input.id) {
    await adminAnnouncementsApi.update(input.id, payload);
    return { ...(payload as unknown as Announcement), id: input.id };
  }
  const { id } = await adminAnnouncementsApi.create(payload);
  return { ...(payload as unknown as Announcement), id };
}

export async function deleteAnnouncement(input: { id: string }): Promise<{ ok: true }> {
  await adminAnnouncementsApi.destroy(input.id);
  return { ok: true };
}

export async function whoAmIAdmin(): Promise<{ email: string | null; isAdmin: boolean }> {
  try {
    const { user, profile } = await authApi.me();
    const u = (user ?? {}) as { email?: string | null };
    const p = (profile ?? {}) as { roles?: string[] };
    return { email: u.email ?? null, isAdmin: Array.isArray(p.roles) && p.roles.includes("admin") };
  } catch {
    return { email: null, isAdmin: false };
  }
}
