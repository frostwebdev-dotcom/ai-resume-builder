import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { filterCookiesForSupabaseProject } from "@/lib/supabase/cookie-filter";
import type { Database } from "@/types/database";

/**
 * Copy `Set-Cookie` values from one middleware `NextResponse` to another (e.g. session refresh
 * onto a redirect).
 */
export function copyResponseCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
}

/**
 * Supabase client for Next.js middleware / proxy / route handlers.
 *
 * When `initialResponse` is omitted, builds a `NextResponse.next()` and **recreates** it inside
 * `setAll` after mutating `request.cookies`. That matches `@supabase/ssr` + Next.js so Server
 * Components receive the refreshed session on the same request (avoids `/app` ↔ `/login` loops).
 *
 * When `initialResponse` is a redirect (non-200), cookies are only applied to that response.
 */
export function createSupabaseMiddlewareClient(
  request: NextRequest,
  initialResponse?: NextResponse,
): { supabase: SupabaseClient<Database>; getResponse: () => NextResponse } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase middleware: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  let response =
    initialResponse ??
    NextResponse.next({
      request: { headers: new Headers(request.headers) },
    });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return filterCookiesForSupabaseProject(request.cookies.getAll(), url);
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // Only middleware `NextResponse.next()` should be recreated so updated `Cookie` headers reach
        // Server Components. Plain `new NextResponse(html)` (e.g. auth email handoff) must stay intact.
        if (
          response.status === 200 &&
          response.headers.get("x-middleware-next") === "1"
        ) {
          response = NextResponse.next({
            request: { headers: new Headers(request.headers) },
          });
        }

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(
            name,
            value,
            options as Parameters<typeof response.cookies.set>[2],
          );
        });
      },
    },
  });

  return {
    supabase,
    getResponse: () => response,
  };
}
