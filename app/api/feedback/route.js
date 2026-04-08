import { createServerClient } from "../../lib/supabase";
import { feedbackSchema } from "../../lib/validation";

// POST : envoyer un feedback beta
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();

    let validated;
    try {
      validated = feedbackSchema.parse(body);
    } catch (err) {
      return Response.json({ error: "Données invalides", details: err.errors?.map(e => e.message) }, { status: 400 });
    }

    const { type, message, rating, planId } = validated;

    const { data, error } = await supabase.from("feedback").insert({
      user_id: user.id,
      user_email: user.email,
      type: type,
      message: message.trim().slice(0, 2000),
      rating: rating || null,   // 1-5
      plan_id: planId || null,
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;
    return Response.json({ success: true, id: data.id });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// GET : récupérer les feedbacks (admin uniquement)
export async function GET(request) {
  try {
    const adminSecret = request.headers.get("x-admin-secret");
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return Response.json({ error: "Accès refusé" }, { status: 403 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
