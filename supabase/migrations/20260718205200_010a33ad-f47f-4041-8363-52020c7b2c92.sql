
-- chatbot_orders
DROP POLICY IF EXISTS "Anyone can read orders" ON public.chatbot_orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.chatbot_orders;
CREATE POLICY "chatbot_orders: admin read"
  ON public.chatbot_orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "chatbot_orders: admin write"
  ON public.chatbot_orders FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- chatbot_conversations
DROP POLICY IF EXISTS "Anyone can read conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Anyone can update conversations" ON public.chatbot_conversations;
DROP POLICY IF EXISTS "Anyone can create conversation" ON public.chatbot_conversations;
CREATE POLICY "chatbot_conversations: admin all"
  ON public.chatbot_conversations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- chatbot_messages
DROP POLICY IF EXISTS "Anyone can read messages" ON public.chatbot_messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.chatbot_messages;
CREATE POLICY "chatbot_messages: admin all"
  ON public.chatbot_messages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- REVOKE EXECUTE from anon on internal/trigger helpers.
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.orders_qualify_referral() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.pricing_settings_log_change() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.profiles_create_pending_referral() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.profiles_set_referral_code() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.referrals_issue_credits() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reviews_touch_approved_at() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.support_ticket_touch_last_message() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.touch_blog_seo_overrides_updated_at() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.redeem_referral_credit(uuid, integer, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_referral_balance(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_referral_credit(uuid, integer, integer) TO authenticated;
