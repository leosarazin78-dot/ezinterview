import { NextResponse } from "next/server";

// OAuth callback route for Google login (PKCE flow).
// After Google authenticates, Supabase redirects here with ?code=XXX.
// We forward the code to the main page where the client-side Supabase
// SDK will detect it and complete the session exchange automatically.
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    // Forward all auth params to root — the Supabase browser client
    // will detect them via detectSessionInUrl and exchange the code
    const redirectUrl = new URL(origin);
    redirectUrl.searchParams.set("code", code);
    // Copy other params that Supabase may need
    for (const [key, value] of requestUrl.searchParams.entries()) {
      if (key !== "code") redirectUrl.searchParams.set(key, value);
    }
    return NextResponse.redirect(redirectUrl.toString());
  }

  return NextResponse.redirect(origin);
}
