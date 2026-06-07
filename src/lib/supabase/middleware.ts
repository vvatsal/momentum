import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { asProfileClient, getProfileRole } from "@/lib/supabase/profile";
import type { CookieToSet } from "@/lib/supabase/cookies";

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
      setAll(cookiesToSet: CookieToSet[]) {
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
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth");

  const isPublicRoute = pathname === "/" || isAuthRoute;

  if (!user && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const roleCookie = request.cookies.get("user-role")?.value;
    let role = roleCookie;

    if (!role) {
      role = (await getProfileRole(asProfileClient(supabase), user.id)) ?? undefined;
      if (role) {
        supabaseResponse.cookies.set("user-role", role, {
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          sameSite: "lax",
        });
      }
    }

    if (isAuthRoute || pathname === "/") {
      if (role === "superadmin" || role === "teacher" || role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (role === "student") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      // Logged in but no profile/role — stay on current page (avoid redirect loop)
      return supabaseResponse;
    }

    if (pathname.startsWith("/admin") && role !== "superadmin" && role !== "teacher" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (
      (pathname.startsWith("/dashboard") ||
        pathname.startsWith("/tests")) &&
      role !== "student"
    ) {
      if (role === "superadmin" || role === "teacher" || role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return supabaseResponse;
}
