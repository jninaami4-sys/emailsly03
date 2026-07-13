-- ============================================================
-- 1. Roles system (admin gate)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ============================================================
-- 2. Chatbot conversations
-- ============================================================
CREATE TABLE public.chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  visitor_name text NOT NULL DEFAULT '',
  order_id text,
  email text,
  status text NOT NULL DEFAULT 'bot' CHECK (status IN ('bot','live','closed')),
  short_code text NOT NULL DEFAULT lower(substr(md5(random()::text), 1, 4)),
  last_message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.chatbot_conversations TO anon, authenticated;
GRANT ALL ON public.chatbot_conversations TO service_role;
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Anyone can create a conversation (anonymous widget)
CREATE POLICY "Anyone can create conversation" ON public.chatbot_conversations
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Anyone can read/update a conversation (session_id acts as the bearer secret)
CREATE POLICY "Anyone can read conversations" ON public.chatbot_conversations
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can update conversations" ON public.chatbot_conversations
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_chatbot_conversations_session ON public.chatbot_conversations(session_id);
CREATE INDEX idx_chatbot_conversations_short_code ON public.chatbot_conversations(short_code);
CREATE INDEX idx_chatbot_conversations_status ON public.chatbot_conversations(status);

-- ============================================================
-- 3. Chatbot messages
-- ============================================================
CREATE TABLE public.chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user','bot','admin')),
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.chatbot_messages TO anon, authenticated;
GRANT ALL ON public.chatbot_messages TO service_role;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read messages" ON public.chatbot_messages
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can insert messages" ON public.chatbot_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX idx_chatbot_messages_conversation ON public.chatbot_messages(conversation_id, created_at);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chatbot_messages;
ALTER TABLE public.chatbot_messages REPLICA IDENTITY FULL;

-- ============================================================
-- 4. Orders
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.chatbot_order_seq START 1000;

CREATE TABLE public.chatbot_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL UNIQUE DEFAULT ('ORD-' || nextval('public.chatbot_order_seq')::text),
  customer_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  service text NOT NULL DEFAULT '',
  details text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Received' CHECK (status IN ('Received','In progress','Delivered','Cancelled')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.chatbot_orders TO anon, authenticated;
GRANT UPDATE, DELETE ON public.chatbot_orders TO authenticated;
GRANT ALL ON public.chatbot_orders TO service_role;
ALTER TABLE public.chatbot_orders ENABLE ROW LEVEL SECURITY;

-- Anon can create orders (from chatbot) and look them up by order_id
CREATE POLICY "Anyone can create orders" ON public.chatbot_orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read orders" ON public.chatbot_orders
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can update orders" ON public.chatbot_orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete orders" ON public.chatbot_orders
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_chatbot_orders_order_id ON public.chatbot_orders(order_id);
CREATE INDEX idx_chatbot_orders_email ON public.chatbot_orders(email);

-- ============================================================
-- 5. Tickets
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS public.chatbot_ticket_seq START 1000;

CREATE TABLE public.chatbot_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no text NOT NULL UNIQUE DEFAULT ('TKT-' || nextval('public.chatbot_ticket_seq')::text),
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  issue text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','Closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.chatbot_tickets TO anon, authenticated;
GRANT UPDATE, DELETE ON public.chatbot_tickets TO authenticated;
GRANT ALL ON public.chatbot_tickets TO service_role;
ALTER TABLE public.chatbot_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create tickets" ON public.chatbot_tickets
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can read tickets" ON public.chatbot_tickets
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update tickets" ON public.chatbot_tickets
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete tickets" ON public.chatbot_tickets
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 6. Knowledge base
-- ============================================================
CREATE TABLE public.chatbot_kb (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'general',
  title text NOT NULL DEFAULT '',
  answer text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.chatbot_kb TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.chatbot_kb TO authenticated;
GRANT ALL ON public.chatbot_kb TO service_role;
ALTER TABLE public.chatbot_kb ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read enabled KB" ON public.chatbot_kb
  FOR SELECT TO anon, authenticated USING (enabled = true);
CREATE POLICY "Admins can manage KB" ON public.chatbot_kb
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed knowledge base
INSERT INTO public.chatbot_kb (category, title, answer, sort_order) VALUES
  ('services', 'Lead generation (Apollo)', 'We deliver verified B2B lead lists via Apollo. Fixed pricing: 5,000 leads = $20 total; 10,000 leads = $35 total. Delivered as CSV within 24 hours.', 10),
  ('services', 'Website & app development', 'We build custom-coded websites, AI-built websites, and custom apps. Timelines and pricing depend on scope — tap "Talk to a human" for a quote.', 20),
  ('services', 'Google & Meta ads', 'We run paid ads on Google Ads and Meta (Facebook / Instagram) only. We do NOT run TikTok or any other ad platform.', 30),
  ('pricing', '5,000 leads — $20', '5,000 verified Apollo leads for $20 total. Delivered as CSV within 24 hours.', 10),
  ('pricing', '10,000 leads — $35', '10,000 verified Apollo leads for $35 total. Delivered as CSV within 24 hours.', 20),
  ('help', 'How order status works', 'Give us your order ID (e.g. ORD-1042) and we will show the current status and any notes from the team.', 10),
  ('help', 'Hours', 'Team hours: Sunday–Thursday, 9am–7pm (GMT+6). Outside these hours, leave a ticket and we will reply first thing next business day.', 20);

-- ============================================================
-- 7. Telegram map
-- ============================================================
CREATE TABLE public.chatbot_telegram_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_message_id bigint NOT NULL,
  telegram_chat_id bigint NOT NULL,
  conversation_id uuid NOT NULL REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (telegram_chat_id, telegram_message_id)
);

GRANT ALL ON public.chatbot_telegram_map TO service_role;
ALTER TABLE public.chatbot_telegram_map ENABLE ROW LEVEL SECURITY;
-- No public policies: only service role (server functions) reads/writes this.

-- ============================================================
-- 8. updated_at trigger
-- ============================================================
DROP TRIGGER IF EXISTS trg_chatbot_conversations_updated_at ON public.chatbot_conversations;
CREATE TRIGGER trg_chatbot_conversations_updated_at BEFORE UPDATE ON public.chatbot_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_chatbot_orders_updated_at ON public.chatbot_orders;
CREATE TRIGGER trg_chatbot_orders_updated_at BEFORE UPDATE ON public.chatbot_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_chatbot_tickets_updated_at ON public.chatbot_tickets;
CREATE TRIGGER trg_chatbot_tickets_updated_at BEFORE UPDATE ON public.chatbot_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_chatbot_kb_updated_at ON public.chatbot_kb;
CREATE TRIGGER trg_chatbot_kb_updated_at BEFORE UPDATE ON public.chatbot_kb
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();