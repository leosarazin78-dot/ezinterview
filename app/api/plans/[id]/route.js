import { createServerClient } from "../../../lib/supabase";

// GET : récupérer un plan complet par ID (avec plan_data et job_data)
export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = params;
    if (!id) return Response.json({ error: "ID manquant" }, { status: 400 });

    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    if (!data) return Response.json({ error: "Plan non trouvé" }, { status: 404 });

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
