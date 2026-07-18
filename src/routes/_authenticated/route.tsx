import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { apiHasToken } from "@/lib/auth-client";

/**
 * Auth gate — accepts EITHER a PHP API JWT (localStorage `emailsly_jwt`)
 * OR a live Supabase session, so the app keeps working while individual
 * features are migrated to the PHP backend.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (apiHasToken()) return {};
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) {
      throw redirect({ to: "/login", search: { mode: "signin", redirect: location.href } });
    }
    return { user: data.session.user };
  },
  component: () => <Outlet />,
});
