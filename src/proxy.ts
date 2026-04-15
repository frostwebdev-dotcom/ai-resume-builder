import { NextResponse, type NextRequest } from "next/server";

import { isPublicPath } from "@/lib/auth/config";
import { ROUTES } from "@/lib/constants";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

/**
 * Refreshes Supabase session cookies and enforces auth boundaries for `/app` and `/admin`.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createSupabaseMiddlewareClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!isPublicPath(pathname)) {
    if (!user) {
      const loginUrl = new URL(ROUTES.auth.login, request.url);
      loginUrl.searchParams.set(
        "next",
        `${pathname}${request.nextUrl.search}`,
      );
      return NextResponse.redirect(loginUrl);
    }
  }

  if (user && pathname.startsWith(ROUTES.admin.root)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL(ROUTES.app.root, request.url));
    }
  }

  if (
    user &&
    (pathname === ROUTES.auth.login ||
      pathname === ROUTES.auth.signup ||
      pathname === ROUTES.auth.forgotPassword)
  ) {
    return NextResponse.redirect(new URL(ROUTES.app.root, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
