import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Use getSession() — reads local storage without a network call, so a
    // transient network/API hiccup doesn't kick a signed-in user to /auth.
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) {
      throw redirect({ to: "/auth", search: { mode: "signin", redirect: location.href } });
    }
    return { user: data.session.user };
  },
  component: () => <Outlet />,
});
