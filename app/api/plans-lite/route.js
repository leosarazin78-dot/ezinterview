import { createServerClient } from "../../lib/supabase";

// GET : récupérer les métadonnées LÉGÈRES des plans (pour le dashboard, sans plan_data)
// Utilisé après un reload pour afficher vite la liste des plans
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return Response.json({ error: "Non authentifié" }, { status: 401 });

    // Retourne UNIQUEMENT les métadonnées, pas plan_data (trop lourd)
    // Cela permet au dashboard de charger super vite
    const { data, error } = await supabase
      .from("plans")
      .select("id, job_title, company, interview_date, next_interlocutor, completed_days, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json(data, {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Plans lite error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
