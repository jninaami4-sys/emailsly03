ALTER TABLE public.chatbot_kb
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_key text;

CREATE UNIQUE INDEX IF NOT EXISTS chatbot_kb_auto_source_key
  ON public.chatbot_kb (source_key)
  WHERE source = 'auto';

CREATE INDEX IF NOT EXISTS chatbot_kb_source_idx
  ON public.chatbot_kb (source);