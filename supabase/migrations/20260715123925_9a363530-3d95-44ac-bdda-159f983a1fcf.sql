ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS path_patterns text[] NOT NULL DEFAULT ARRAY['*']::text[],
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'all';

ALTER TABLE public.announcements
  DROP CONSTRAINT IF EXISTS announcements_audience_check;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_audience_check
  CHECK (audience IN ('all','guests','authenticated','admins'));