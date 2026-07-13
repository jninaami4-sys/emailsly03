import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { BLOG_POSTS } from "@/lib/blog-posts";

export default defineTool({
  name: "list_blog_posts",
  title: "List blog posts",
  description: "List LyraData blog posts with title, excerpt, category, and publish date.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max posts to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ limit }) => {
    const items = BLOG_POSTS.slice(0, limit ?? 20).map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      category: p.category,
      publishedAt: p.publishedAt,
      url: `https://lyradata.app/blog/${p.slug}`,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(items, null, 2) }],
      structuredContent: { posts: items, total: BLOG_POSTS.length },
    };
  },
});
