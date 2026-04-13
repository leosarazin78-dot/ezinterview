import { NextResponse } from "next/server";

// OAuth callback route (flow implicite).
// En flow implicite, cette route n'est normalement pas utilisée
// car le token arrive directement dans le hash de l'URL principale.
// On la garde comme filet de sécurité pour rediriger vers l'accueil.
export async function GET(request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  // Redirige simplement vers l'accueil — le SDK Supabase gère le token dans le hash
  return NextResponse.redirect(origin);
}
