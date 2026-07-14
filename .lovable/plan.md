
## Goal
Replace the demo review wall with a small curated set + a real, on-brand review system where signed-in customers can submit a text or video review, videos are compressed in the browser before upload, and an admin approves before anything shows on the site.

## 1. Curate the demo reviews
Keep 5 of the strongest, most human-sounding entries in `Testimonials.tsx` (Sarah Chen, Marcus Rivera, Priya Anand, Omar Raza, Hassan Ali) and drop the rest. The scrolling column layout becomes a single balanced row so 5 feels intentional, not sparse. The "380+ reviews" badge becomes a live count of approved reviews.

## 2. Data model (Lovable Cloud)
New table `public.reviews`:

```text
id uuid pk
user_id uuid  -> auth.users (owner, not null)
display_name text
role text                     -- e.g. "Founder, Acme"
country text
rating int 1..5
body text                     -- text review (nullable if video)
media_kind text               -- 'text' | 'video'
video_path text               -- storage path in 'reviews' bucket
video_poster_path text        -- auto-generated poster frame
duration_sec int
status text                   -- 'pending' | 'approved' | 'rejected'
reject_reason text
created_at / updated_at / approved_at
```

RLS:
- `authenticated` can INSERT own row (status forced to `pending` via trigger)
- `authenticated` can SELECT own rows (any status) — so they see their submission
- `anon` + `authenticated` can SELECT approved rows only (safe columns)
- Admins (`has_role(..,'admin')`) can UPDATE status + delete

Storage bucket `reviews` (public read, authenticated write, 50 MB limit, mp4/webm/jpg only). Objects live under `{user_id}/{uuid}.mp4` so RLS on `storage.objects` scopes writes to the owner.

## 3. Submission flow (in the Testimonials section)
"Share your experience" button next to the header.
- If not signed in → inline sheet asking to sign in first (link to `/auth`, returns to `/#reviews`).
- If signed in → 3-step modal:
  1. **Choose format** — Text or Video card selector.
  2. **Compose** —
     - Text: 5-star picker + textarea (min 40, max 600 chars) + optional role/country.
     - Video: file input or in-browser camera recorder (max 60 s); preview + retake.
  3. **Review & submit** — legal consent checkbox ("You agree that we may display this review with your name/photo"). Submit → server fn → status `pending`.
- After submit: success screen "Thanks — we'll publish it after a quick review."

## 4. Browser-side video compression
Utility `src/lib/video-compress.ts`:
- Load the file into a hidden `<video>`; play muted.
- Downscale to max 720 px longest side onto an `OffscreenCanvas`; `captureStream(30)` piped through `MediaRecorder` with `video/webm;codecs=vp9` at ~1.8 Mbps + Opus audio.
- Falls back to VP8 / native `video/mp4` where VP9 isn't supported (Safari).
- Also extract a poster frame at ~1 s via `canvas.toBlob('image/jpeg', 0.8)`.
- Uploads: signed upload via `supabase.storage.from('reviews').upload(...)` from the browser (RLS on `storage.objects` restricts to `{auth.uid()}/...`).
- Hard limits enforced client-side: input ≤ 200 MB pre-compression, output target ≤ 15 MB, duration ≤ 60 s. Anything larger is rejected with a clear message.

No wasm/ffmpeg — everything uses native browser APIs so the bundle stays lean and the site doesn't slow down.

## 5. Server functions
`src/lib/reviews.functions.ts`:
- `listApprovedReviews()` — public, server-publishable client, returns approved rows with public URLs.
- `submitReview({ kind, rating, body, videoPath, posterPath, role, country, displayName })` — `requireSupabaseAuth`, Zod-validated, inserts as `pending`.
- `listMyReviews()` — `requireSupabaseAuth`, returns caller's rows.
- `moderateReview({ id, action, reason })` — `requireSupabaseAuth` + `has_role('admin')` check; sets `approved` / `rejected`.

## 6. Admin moderation
New card in `/admin` (`ReviewsAdmin.tsx`) listing pending reviews with inline video preview, approve / reject buttons, and reason field. Only visible to `admin` role.

## 7. Display integration
`Testimonials` now renders:
- Curated 5 static testimonials (fallback / always-on trust wall).
- Approved video reviews grid (was the single Amine card — becomes dynamic).
- Approved text reviews mixed into the scrolling wall behind them.
Loaded via `listApprovedReviews` in the route loader (public fn, safe for SSR).

## 8. Trust & polish
- Verified badge only on rows whose `user_id` matches a completed order in `chatbot_orders` (SQL join in the fetcher).
- Per-review permalink `/reviews/{id}` with proper OG tags for sharing.
- Rate-limit: one pending submission at a time per user (unique partial index on `user_id where status='pending'`).

## Technical details

Files added:
- `supabase/migrations/*_reviews.sql` — table + policies + storage bucket policies + `has_role` check reused.
- `src/lib/reviews.functions.ts`, `src/lib/reviews.types.ts`
- `src/lib/video-compress.ts`
- `src/components/site/ReviewSubmitModal.tsx`
- `src/components/admin/ReviewsAdmin.tsx`
- `src/routes/reviews.$id.tsx` (permalink)

Files changed:
- `src/components/site/Testimonials.tsx` — trim demo list, add CTA button, wire dynamic reviews.
- `src/routes/index.tsx` — loader calls `listApprovedReviews`.
- `src/routes/admin.tsx` — mount `ReviewsAdmin`.

Not doing (out of scope, ask if wanted):
- SMS/email notifications on new pending review.
- Server-side re-encode fallback for unsupported browsers.
- Photo-only reviews (only text or video, per your choice).

Confirm and I'll build it.
