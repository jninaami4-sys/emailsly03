import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

// NOTE: Supabase bearer attacher removed as part of the PHP/MySQL migration.
// Any remaining `*.functions.ts` server function that expects a Supabase
// bearer will 401 until it's rewritten to call the PHP API via `api-client`.
// That rewrite is the next batches in the migration plan; the client itself
// sends `Authorization: Bearer <jwt>` on every /api/* call via api-client.ts.

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
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
