ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS card_style text NOT NULL DEFAULT 'glass',
  ADD COLUMN IF NOT EXISTS title_emoji text NOT NULL DEFAULT '';