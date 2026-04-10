import { createServerClient } from "../../../lib/supabase";

// GET : vérifier si l'utilisateur a envoyé au moins un feedback
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const { count, error } = await supabase
      .from("feedback")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (error) throw error;
    return Response.json({ hasFeedback: (count || 0) > 0 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
