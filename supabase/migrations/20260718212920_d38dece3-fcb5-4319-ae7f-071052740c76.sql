CREATE POLICY "Admins can view stripe events"
ON public.stripe_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view stripe webhook deliveries"
ON public.stripe_webhook_deliveries FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view server event log"
ON public.server_event_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view server tracking config"
ON public.server_tracking_config FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view chatbot telegram map"
ON public.chatbot_telegram_map FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));