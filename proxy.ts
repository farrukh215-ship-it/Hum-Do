import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPath = pathname === "/login";

  if (!user) {
    if (!isLoginPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  if (isLoginPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, household_id")
    .eq("id", user.id)
    .maybeSingle();

  const hasProfile = !!profile?.role && !!profile?.household_id;
  const isOnboardingPath = pathname === "/onboarding";

  if (!hasProfile && !isOnboardingPath) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (hasProfile && isOnboardingPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|Icon/|sw.js|api/reports/generate).*)",
  ],
};
