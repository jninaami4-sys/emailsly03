ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS announcements_priority_updated_idx
  ON public.announcements (priority DESC, updated_at DESC);