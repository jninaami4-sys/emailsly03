import ogDefaultAsset from "@/assets/og-emailsly.png.asset.json";
import ogPricingAsset from "@/assets/og-pricing.png.asset.json";
import ogBlogAsset from "@/assets/og-blog.png.asset.json";

/**
 * Branded Open Graph / Twitter card templates.
 *
 * Each URL points to a 1200x630 PNG on the Lovable Assets CDN. Social
 * crawlers (Facebook, LinkedIn, X, Slack, iMessage) require ABSOLUTE URLs
 * for og:image / twitter:image — relative paths are silently dropped. We
 * prefix the CDN path with the production origin so previews render on
 * every platform, regardless of where the tag is scraped from.
 */
const SITE_ORIGIN = "https://emailsly.com";

function absolute(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

export const OG_IMAGES = {
  default: absolute(ogDefaultAsset.url),
  pricing: absolute(ogPricingAsset.url),
  blog: absolute(ogBlogAsset.url),
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
