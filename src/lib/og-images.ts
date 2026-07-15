import ogDefaultAsset from "@/assets/og-emailsly.png.asset.json";
import ogPricingAsset from "@/assets/og-pricing.png.asset.json";
import ogBlogAsset from "@/assets/og-blog.png.asset.json";

/**
 * Branded Open Graph / Twitter card templates.
 *
 * Each URL points to a 1200x630 PNG on the Lovable Assets CDN.
 * Use these in a route's `head()` meta for consistent social previews.
 *
 * NOTE: crawlers prefer absolute URLs. When the site is on a real domain,
 * prefix these with that origin via a server helper. Until then relative
 * CDN paths still render inside the Lovable preview and hosted domains.
 */
export const OG_IMAGES = {
  default: ogDefaultAsset.url,
  pricing: ogPricingAsset.url,
  blog: ogBlogAsset.url,
} as const;

export type OgImageKey = keyof typeof OG_IMAGES;

/**
 * Build the standard social-card meta entries (og:image + twitter:image
 * + twitter:card). Spread the result into a route's `meta` array.
 */
export function ogImageMeta(image: string = OG_IMAGES.default) {
  return [
    { name: "twitter:card", content: "summary_large_image" },
    { property: "og:image", content: image },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:image", content: image },
  ] as const;
}
