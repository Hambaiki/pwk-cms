import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// This route is called by Supabase after:
// - Email confirmation link is clicked
// - OAuth provider redirects back to your app
// It exchanges the one-time code for a session and stores it in cookies.

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/cms";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // If Supabase returned an error (e.g. link expired)
  if (error) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", errorDescription ?? error);
    return NextResponse.redirect(url);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      const url = new URL("/login", origin);
      url.searchParams.set("error", exchangeError.message);
      return NextResponse.redirect(url);
    }
  }

  // Redirect to the intended destination (defaults to /cms)
  return NextResponse.redirect(new URL(next, origin));
}
