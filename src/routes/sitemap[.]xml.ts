import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { BLOG_POSTS } from "@/lib/blog-posts";

const BASE_URL = "https://emailsly.com";

const paths = [
  { path: "/", priority: "1.0", changefreq: "weekly" as const },
  { path: "/store", priority: "0.9", changefreq: "daily" as const },
  { path: "/pricing", priority: "0.9", changefreq: "weekly" as const },
  { path: "/about", priority: "0.7", changefreq: "monthly" as const },
  { path: "/blog", priority: "0.8", changefreq: "weekly" as const },
  { path: "/apollo-leads-export", priority: "0.8", changefreq: "monthly" as const },
  { path: "/linkedin-sales-navigator-leads", priority: "0.8", changefreq: "monthly" as const },
  { path: "/zoominfo-leads", priority: "0.8", changefreq: "monthly" as const },
  { path: "/manual-lead-research", priority: "0.8", changefreq: "monthly" as const },
  { path: "/website-design", priority: "0.6", changefreq: "monthly" as const },
  { path: "/contact", priority: "0.6", changefreq: "monthly" as const },
  { path: "/track-order", priority: "0.4", changefreq: "monthly" as const },
  { path: "/privacy-policy", priority: "0.3", changefreq: "yearly" as const },
  { path: "/terms", priority: "0.3", changefreq: "yearly" as const },
  { path: "/refund-policy", priority: "0.3", changefreq: "yearly" as const },
];

const blogPaths = BLOG_POSTS.map((p) => ({
  path: `/blog/${p.slug}`,
  priority: "0.7",
  changefreq: "monthly" as const,
}));

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const urls = [...paths, ...blogPaths]
          .map(
            (e) =>
              `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
