import { useEffect } from "react";
import { useSiteContent } from "@/hooks/use-site-content";

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const STYLE_ID = "brand-color-overrides";

/**
 * Applies admin-configured branding at runtime:
 * - overrides the --violet / --ink CSS design tokens with the chosen colors
 * - swaps the favicon <link> when a custom favicon URL is set
 * - updates the document title's brand suffix
 *
 * Rendered once, near the root, after providers are ready.
 */
export function BrandingApplier() {
  const branding = useSiteContent("branding");

  useEffect(() => {
    if (typeof document === "undefined") return;

    const primary = HEX_RE.test(branding.primary_color || "") ? branding.primary_color : null;
    const accent = HEX_RE.test(branding.accent_color || "") ? branding.accent_color : null;
    const ink = HEX_RE.test(branding.ink_color || "") ? branding.ink_color : null;

    const parts: string[] = [];
    if (primary) {
      parts.push(`--violet: ${primary};`);
      parts.push(`--violet-soft: color-mix(in oklab, ${primary} 10%, transparent);`);
      parts.push(`--color-violet: ${primary};`);
      parts.push(`--color-violet-soft: color-mix(in oklab, ${primary} 10%, transparent);`);
      // Lock shadcn primary tokens to the brand color too
      parts.push(`--primary: ${primary};`);
      parts.push(`--color-primary: ${primary};`);
      parts.push(`--ring: ${primary};`);
      parts.push(`--color-ring: ${primary};`);
    }
    if (accent) {
      parts.push(`--emerald: ${accent}; --color-emerald: ${accent};`);
      parts.push(`--emerald-soft: color-mix(in oklab, ${accent} 12%, transparent);`);
      parts.push(`--color-emerald-soft: color-mix(in oklab, ${accent} 12%, transparent);`);
    }
    // Only set the ink token itself — never override --foreground globally,
    // otherwise dark surfaces (.theme-midnight) inherit dark ink on dark bg
    // and text becomes unreadable.
    if (ink) parts.push(`--ink: ${ink}; --color-ink: ${ink};`);

    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (parts.length === 0) {
      if (el) el.remove();
    } else {
      if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
        document.head.appendChild(el);
      }
      // Scope brand overrides to :root only. .theme-midnight already
      // defines its own light --foreground for dark surfaces; leave it alone.
      el.textContent = `:root { ${parts.join(" ")} }`;
    }
  }, [branding.primary_color, branding.accent_color, branding.ink_color]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const href = (branding.favicon_url || "").trim();
    if (!href) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [branding.favicon_url]);

  return null;
}
