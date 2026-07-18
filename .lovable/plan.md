# Rewire frontend from Supabase → PHP API

## Reality check

- 43 files in `src/` still import `@/integrations/supabase/*`.
- Every `createServerFn` uses `requireSupabaseAuth`; the `_authenticated` gate uses `supabase.auth.getUser()`; storage calls use `supabase.storage`.
- The PHP backend + `src/lib/api-client.ts` SDK + MySQL schema are already in place and match the current data shapes.

Rewiring all of this cleanly is roughly **6 phased passes**. Each phase leaves the preview building and the site usable, so you can review before moving on.

## Ground rules for the rewire

- Delete `createServerFn` usage. All data calls become direct `fetch` via the `api` client from `src/lib/api-client.ts` inside React Query hooks (`useQuery` / `useMutation`).
- Auth becomes a plain React context reading `localStorage` for the JWT the PHP `/auth/login` returns. No more `_authenticated` Supabase gate — replace with a simple `<RequireAuth>` wrapper.
- File uploads go through `api.uploadFile(bucket, file)` → PHP `/files/upload` → local `/public_html/uploads/`.
- Stripe checkout redirect + webhook stay; the webhook already lives in PHP.
- `import.meta.env.VITE_API_URL` points at your BD host (e.g. `https://api.emailsly.com`). I'll add it to `.env.example`.
- Remove `src/integrations/supabase/*`, `src/start.ts` bearer middleware, and Supabase-only routes at the end so nothing dangles.

## Phase 1 — Auth + shell (foundation)

- New `src/lib/auth-client.ts`: login / signup / OTP verify / reset via `api.*`, stores `{ token, user }` in `localStorage`.
- Rewrite `src/hooks/use-auth.tsx` to read that store, expose `user`, `signIn`, `signOut`, `signUp`, `verifyOtp`.
- Replace `src/routes/_authenticated/route.tsx` with a client-side check against the auth store (redirect to `/login`).
- Update `src/routes/login.tsx`, `reset-password.tsx`, `admin-login.tsx` to call the new client.
- Strip `attachSupabaseAuth` from `src/start.ts`; add a generic bearer attacher for any remaining server fns during migration (removed at end).
- Update `src/routes/__root.tsx`: drop `onAuthStateChange`, replace with a storage-event listener that invalidates queries.

## Phase 2 — Customer surfaces

- `src/hooks/use-my-profile.ts`, `use-all-products.ts`, `use-pricing-overrides.ts`, `use-site-content.ts` → React Query hooks hitting `api.*`.
- Order flow: `src/lib/orders.functions.ts`, `cart.tsx`, `OrderBuilder.tsx`, `OrderDrawer.tsx`, `OrderForm.tsx`, `CartDrawer.tsx`, `_authenticated/dashboard.tsx`, `_authenticated/invoice.$orderId.tsx`.
- Contact / support / reviews / referrals / samples on the customer side.
- Tracking: keep client tracking; drop `track-server-event` edge-fn calls (or point them at a new PHP endpoint — mark as optional).

## Phase 3 — Blog + public content

- `src/lib/blog-cms.functions.ts`, `blog-posts.ts`, `blog-analytics.functions.ts`, `blog-seo.functions.ts`.
- Routes: `blog.index.tsx`, `blog.$slug.tsx`, sitemap.
- Load public data in route loaders via `fetch` against the PHP API (no SSR-only auth needed).

## Phase 4 — Admin panel (biggest chunk)

Rewire every `src/components/admin/*Admin.tsx` (~30 files) to call the matching PHP admin controller through `api.admin.*`:
Orders, Products, ProductDetails, Pricing, SiteContent, ServiceCardsEditor, MediaItemsEditor, BrandSettings, Announcements, Reviews, Referrals, Campaigns, StoreOffers, TelegramBots, Chatbot, ContactLeads, SupportTickets, BackupRestore, ImportOrders, SampleDatasets, ConversionEvents, ServerTracking, StripeEvents, BlogPosts, BlogSeo, BlogAnalytics, ImportExport, EmailTest, DebugMode, SocialLinks.

## Phase 5 — Chatbot, referrals, telegram, storage

- `src/lib/chatbot*.ts`, `chatbot.functions.ts`, `ChatbotWidget.tsx`.
- `ReferralCapture.tsx`, `referrals.functions.ts`, `referral-log.server.ts`.
- Telegram webhook: keep as a TanStack public route that forwards to PHP, or move to PHP entirely (recommended — remove the TS route).
- Uploads across `BrandSettingsAdmin`, `AvatarCropDialog`, `MediaItemsEditor`, `ServiceCardsEditor`, `ImageCropperModal` → `api.uploadFile`.

## Phase 6 — Cleanup

- Delete `src/integrations/supabase/`, `src/lib/*.server.ts` Supabase helpers, unused `.functions.ts` files, `supabase/` folder, `attachSupabaseAuth`.
- Drop Supabase env vars from `.env.example`; document `VITE_API_URL`.
- Update `AGENTS.md` / `DEPLOY.md` with the new architecture.
- Final build + typecheck; fix any stragglers.

## What this means turn-by-turn

Each phase is ~1–3 large turns depending on how the build reacts. I will:

1. Edit the files for a phase in parallel.
2. Rely on the auto-build; fix reported errors.
3. Stop at the end of each phase and report so you can preview and say "next".

## Confirm before I start

Two decisions I need from you:

1. **`VITE_API_URL` for preview** — during rewiring in Lovable there's no PHP host reachable. Options:
   - (a) I set `VITE_API_URL=https://api.emailsly.com` (or whatever your BD host will be) — preview will show network errors until you deploy PHP, but the code is production-ready.
   - (b) I leave it blank and add a small in-preview note; you set it in `.env` before build.
2. **Kill switch for Supabase** — should I delete `src/integrations/supabase/` at the end of Phase 6, or keep it dormant so you can flip back? Recommendation: delete.

Reply with your picks (or "a + delete") and I'll start Phase 1.
