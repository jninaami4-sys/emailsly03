import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { apiHasToken } from "@/lib/auth-client";

/**
 * Auth gate — accepts a PHP API JWT stored under localStorage `emailsly_jwt`.
 * Runs client-only so the token check happens in the browser.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return {};
    if (apiHasToken()) return {};
    throw redirect({ to: "/login", search: { mode: "signin", redirect: location.href } });
  },
  component: () => <Outlet />,
});
