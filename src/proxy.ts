import { NextResponse, type NextRequest } from "next/server";

import { isPublicPath } from "@/lib/auth/config";
import { ROUTES } from "@/lib/constants";
import { filterCookiesForSupabaseProject } from "@/lib/supabase/cookie-filter";
import {
  copyResponseCookies,
  createSupabaseMiddlewareClient,
} from "@/lib/supabase/middleware";

/**
 * Refreshes Supabase session cookies and enforces auth boundaries for `/app` and `/admin`.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return NextResponse.next({
      request: { headers: new Headers(request.headers) },
    });
  }

  const pathname = request.nextUrl.pathname;

  /**
   * `getUser()` calls Supabase Auth to validate/refresh the JWT (~100–400ms+). Only run it when
   * we need session data for redirects or protected routes — not on every marketing page load.
   */
  const needsSession =
    !isPublicPath(pathname) ||
    pathname.startsWith(ROUTES.admin.root) ||
    pathname === ROUTES.auth.login ||
    pathname === ROUTES.auth.signup ||
    pathname === ROUTES.auth.forgotPassword;

  if (!needsSession) {
    return NextResponse.next({
      request: { headers: new Headers(request.headers) },
    });
  }

  const { supabase, getResponse } = createSupabaseMiddlewareClient(request);

  const authCookies = filterCookiesForSupabaseProject(request.cookies.getAll(), url).filter((c) =>
    c.name.startsWith("sb-"),
  );
  console.log(`[proxy] ${pathname} | auth cookies: ${authCookies.length > 0 ? authCookies.map((c) => c.name).join(", ") : "(none)"}`);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.log(`[proxy] ${pathname} | getUser error: ${userError.message}`);
  }
  console.log(`[proxy] ${pathname} | user: ${user ? user.id : "null"}`);

  if (!isPublicPath(pathname)) {
    if (!user) {
      const loginUrl = new URL(ROUTES.auth.login, request.url);
      loginUrl.searchParams.set(
        "next",
        `${pathname}${request.nextUrl.search}`,
      );
      const redirect = NextResponse.redirect(loginUrl);
      copyResponseCookies(getResponse(), redirect);
      return redirect;
    }
  }

  if (user && pathname.startsWith(ROUTES.admin.root)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const redirect = NextResponse.redirect(new URL(ROUTES.app.root, request.url));
      copyResponseCookies(getResponse(), redirect);
      return redirect;
    }
  }

  if (
    user &&
    (pathname === ROUTES.auth.login ||
      pathname === ROUTES.auth.signup ||
      pathname === ROUTES.auth.forgotPassword)
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      const redirect = NextResponse.redirect(new URL(ROUTES.app.root, request.url));
      copyResponseCookies(getResponse(), redirect);
      return redirect;
    }

    const redirect = NextResponse.redirect(new URL(ROUTES.auth.incomplete, request.url));
    copyResponseCookies(getResponse(), redirect);
    return redirect;
  }

  return getResponse();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
