import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// OAuth callback route (PKCE flow).
// Le serveur échange le code auth contre une session, puis redirige vers la page principale.
// Compatible avec tous les navigateurs (Brave, Safari, Firefox, Chrome).
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    // Échange le code côté serveur via Supabase
    // Le client PKCE stocke le code_verifier dans localStorage,
    // donc on redirige simplement vers la page principale avec le code
    // et le SDK client fera l'échange automatiquement
    const redirectUrl = new URL(origin);
    redirectUrl.searchParams.set("code", code);
    // Copie les autres params auth nécessaires au PKCE
    for (const [key, value] of requestUrl.searchParams.entries()) {
      if (key !== "code") redirectUrl.searchParams.set(key, value);
    }
    return NextResponse.redirect(redirectUrl.toString());
  }

  // Pas de code = on redirige vers l'accueil
  return NextResponse.redirect(origin);
}
