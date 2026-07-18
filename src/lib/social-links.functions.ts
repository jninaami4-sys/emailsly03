/**
 * Social links — thin proxies to PHP API (Batch 5 migration).
 */
import {
  socialLinksApi,
  adminSocialLinksApi,
  api,
} from "@/lib/api-client";

export type SocialIconKey =
  | "whatsapp"
  | "email"
  | "instagram"
  | "telegram"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "discord"
  | "github"
  | "link";

export type SocialLink = {
  id: string;
  platform: string;
  label: string;
  href: string;
  color: string;
  icon: SocialIconKey;
  enabled: boolean;
  sort_order: number;
  updated_at: string;
};

type Empty = Record<string, never>;

export async function listPublicSocialLinks(_?: { data?: Empty }): Promise<SocialLink[]> {
  try {
    const { links } = await socialLinksApi.list();
    return (links ?? []) as SocialLink[];
  } catch (e) {
    console.error("listPublicSocialLinks", e);
    return [];
  }
}

export async function adminListSocialLinks(_?: { data?: Empty }): Promise<SocialLink[]> {
  const { links } = await adminSocialLinksApi.list();
  return (links ?? []) as SocialLink[];
}

export async function adminUpsertSocialLink(args: {
  data: {
    id?: string;
    platform: string;
    label: string;
    href: string;
    color: string;
    icon: string;
    enabled: boolean;
    sort_order: number;
  };
}): Promise<{ ok: true }> {
  await adminSocialLinksApi.upsert(args.data);
  return { ok: true };
}

export async function adminToggleSocialLink(args: {
  data: { id: string; enabled: boolean };
}): Promise<{ ok: true }> {
  await api(`/api/admin/social-links/${args.data.id}/toggle`, {
    method: "POST",
    body: { enabled: args.data.enabled },
  });
  return { ok: true };
}

export async function adminDeleteSocialLink(args: {
  data: { id: string };
}): Promise<{ ok: true }> {
  await adminSocialLinksApi.destroy(args.data.id);
  return { ok: true };
}
