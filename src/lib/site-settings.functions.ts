/**
 * Site settings — thin proxies to PHP API (Batch 5 migration).
 * Consumers strip `useServerFn` and call these directly with `{ data }`.
 */
import { siteSettingsApi, adminSiteSettingsApi } from "@/lib/api-client";

export type TawkPosition = "br" | "bl" | "tr" | "tl";

export type SiteSettings = {
  gtm_id: string;
  ga4_id: string;
  fb_pixel_id: string;
  tiktok_pixel_id: string;
  custom_head_html: string;
  tawk_enabled: boolean;
  tawk_position: TawkPosition;
  support_show_category: boolean;
  updated_at: string;
};

const EMPTY: SiteSettings = {
  gtm_id: "",
  ga4_id: "",
  fb_pixel_id: "",
  tiktok_pixel_id: "",
  custom_head_html: "",
  tawk_enabled: true,
  tawk_position: "br",
  support_show_category: false,
  updated_at: "",
};

type Empty = Record<string, never>;

export async function getSiteSettings(_?: { data?: Empty }): Promise<SiteSettings> {
  try {
    const { settings } = await siteSettingsApi.get();
    return { ...EMPTY, ...(settings ?? {}) } as SiteSettings;
  } catch (e) {
    console.error("getSiteSettings", e);
    return EMPTY;
  }
}

type UpdateInput = {
  gtm_id: string;
  ga4_id: string;
  fb_pixel_id: string;
  tiktok_pixel_id: string;
  custom_head_html: string;
  tawk_enabled: boolean;
  tawk_position: TawkPosition;
  support_show_category?: boolean;
};

export async function updateSiteSettings(args: { data: UpdateInput }): Promise<SiteSettings> {
  const res = (await adminSiteSettingsApi.update(args.data)) as { settings?: SiteSettings };
  return { ...EMPTY, ...(res?.settings ?? args.data) } as SiteSettings;
}
