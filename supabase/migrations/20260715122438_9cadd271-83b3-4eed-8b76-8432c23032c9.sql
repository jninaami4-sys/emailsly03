ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS tawk_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tawk_position text NOT NULL DEFAULT 'br';