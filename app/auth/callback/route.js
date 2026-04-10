import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    // Exchange the code for a session using the service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error("Auth callback error:", err);
    }
  }

  // Redirect to dashboard after successful auth
  const origin = requestUrl.origin;
  return NextResponse.redirect(`${origin}/#dashboard`);
}
