import { createServerClient } from "../../lib/supabase";

// POST : envoyer un feedback beta
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const { type, message, rating, page } = await request.json();
    if (!message || message.trim().length < 5) {
      return Response.json({ error: "Message trop court" }, { status: 400 });
    }

    const { data, error } = await supabase.from("feedback").insert({
      user_id: user.id,
      user_email: user.email,
      type: type || "general",  // "general", "bug", "feature", "improvement"
      message: message.trim().slice(0, 2000),
      rating: rating || null,   // 1-5
      page: page || null,
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
