import { NextResponse } from "next/server";

// OAuth callback route (PKCE flow).
// Reçoit le code auth depuis Supabase et redirige vers la page principale
// Le client PKCE stocke le code_verifier dans localStorage et échange le code
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const origin = requestUrl.origin;

  // Log pour debugging
  if (code) console.log("Auth callback: Received code, redirecting to main app");
  if (error) console.error("Auth callback error:", error, errorDescription);

  if (code) {
    // Construit une URL avec le code EN PARAMETRE DE QUERY (pas en hash)
    // Le SDK client Supabase PKCE extraira le code et l'échangera
    const callbackUrl = new URL(origin);

    // Ajoute le code ET tous les autres paramètres auth
    callbackUrl.searchParams.set("code", code);

    // Copie les autres params nécessaires pour PKCE (state, etc.)
    for (const [key, value] of requestUrl.searchParams.entries()) {
      if (key !== "code" && !callbackUrl.searchParams.has(key)) {
        callbackUrl.searchParams.set(key, value);
      }
    }

    console.log("Redirecting to:", callbackUrl.toString());
    return NextResponse.redirect(callbackUrl.toString());
  }

  // Erreur OAuth ou pas de code
  if (error) {
    const errorUrl = new URL(origin);
    errorUrl.searchParams.set("auth_error", error);
    return NextResponse.redirect(errorUrl.toString());
  }

  // Pas de code ni d'erreur = on redirige vers l'accueil
  return NextResponse.redirect(origin);
}
