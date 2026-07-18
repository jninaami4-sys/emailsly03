import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

// Attach the PHP-API JWT (stored in localStorage as `emailsly_jwt`) to any
// server-fn call so legacy server functions that still exist during the
// Supabase → PHP migration receive an Authorization header. Once every
// consumer switches to `api-client`, server functions and this attacher can
// be removed entirely.
const attachApiAuth = createMiddleware().client(async ({ next }) => {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("emailsly_jwt");
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return next({ headers });
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachApiAuth],
  requestMiddleware: [errorMiddleware],
}));
