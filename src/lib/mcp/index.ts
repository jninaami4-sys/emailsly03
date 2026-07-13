import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list-products";
import getProduct from "./tools/get-product";
import listBlogPosts from "./tools/list-blog-posts";
import quoteCustomOrder from "./tools/quote-custom-order";

// Managed Cloud OAuth issuer must be the direct Supabase host — the
// .lovable.cloud proxy publishes a mismatched issuer and mcp-js rejects it.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "lyradata-mcp",
  title: "LyraData MCP",
  version: "0.1.0",
  instructions:
    "Tools for LyraData — browse prebuilt B2B lead products, look up details by slug, list blog posts, and quote custom lead orders.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProducts, getProduct, listBlogPosts, quoteCustomOrder],
});
