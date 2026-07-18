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

export type SiteTheme = "dark" | "light";

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

/** Append/replace `?theme=<theme>` on an absolute asset URL. */
function withThemeQuery(url: string, theme: SiteTheme): string {
  try {
    const u = new URL(url);
    u.searchParams.set("theme", theme);
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}theme=${theme}`;
  }
}

/**
 * Pull the SSR-resolved theme out of the route match tree, when available.
 * NOTE: TanStack invokes `head()` BEFORE loaders resolve during SSR, so
 * `matches[i].loaderData` is empty here. The theme is stamped onto the
 * SSR HTML response in `src/server.ts` (post-render rewrite) — this hook
 * only helps on client navigations where loaderData is already hydrated.
 */
export function matchTheme(matches: ReadonlyArray<{ routeId?: string; id?: string; loaderData?: unknown }> | undefined): SiteTheme | null {
  if (!matches || matches.length === 0) return null;
  const root = matches.find((m) => m.routeId === "__root__" || m.id === "__root__") ?? matches[0];
  const data = root?.loaderData as { theme?: SiteTheme } | undefined;
  return data?.theme === "light" || data?.theme === "dark" ? data.theme : null;
}

/**
 * Build the standard social-card meta entries (og:image + twitter:image
 * + twitter:card). When a theme is provided, appends `?theme=<theme>` so
 * SSR-rendered share previews reflect the requested variant. When no
 * theme is provided at render time, the SSR pipeline (`src/server.ts`)
 * rewrites the URLs from the incoming request's `?theme=`/cookie.
 */
export function ogImageMeta(image: string = OG_IMAGES.default, theme?: SiteTheme | null) {
  const url = theme ? withThemeQuery(image, theme) : image;
  return [
    { name: "twitter:card", content: "summary_large_image" },
    { property: "og:image", content: url },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { name: "twitter:image", content: url },
  ] as const;
}


