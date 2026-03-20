import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Start with a plain pass-through response
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 1. Write refreshed cookies back onto the request
          //    so downstream Server Components see the new token
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // 2. Recreate the response so it carries the new request state
          supabaseResponse = NextResponse.next({ request });
          // 3. Write refreshed cookies onto the response
          //    so the browser replaces the old token
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: use getClaims(), NOT getSession()
  // getClaims() validates the JWT signature every time — getSession() does not
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // Optional: redirect unauthenticated users away from protected routes
  const { pathname } = request.nextUrl;
  const protectedRoutes = ["/dashboard", "/profile", "/settings"];
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: always return supabaseResponse, never a new NextResponse.next()
  // Returning a different object without copying cookies will desync the browser
  // and server, which terminates the session prematurely
  return supabaseResponse;
}
