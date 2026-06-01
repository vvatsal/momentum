import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { asProfileClient, getProfileRole } from "@/lib/supabase/profile";

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/auth");

  const isPublicRoute = pathname === "/" || isAuthRoute;

  if (!user && !isPublicRoute) {
    const loginUrl = pathname.startsWith("/admin")
      ? new URL("/admin/login", request.url)
      : new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const role =
      (await getProfileRole(asProfileClient(supabase), user.id)) ?? undefined;

    if (isAuthRoute) {
      const dest =
        role === "admin"
          ? "/admin"
          : role === "student"
            ? "/dashboard"
            : "/login";
      return NextResponse.redirect(new URL(dest, request.url));
    }

    if (pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (
      (pathname.startsWith("/dashboard") ||
        pathname.startsWith("/tests")) &&
      role !== "student"
    ) {
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return supabaseResponse;
}
