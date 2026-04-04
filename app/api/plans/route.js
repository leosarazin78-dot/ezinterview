import { createServerClient } from "../../lib/supabase";

// GET : récupérer tous les plans de l'utilisateur
export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const { data, error } = await supabase
      .from("plans")
      .select("id, job_title, company, interview_date, next_interlocutor, completed_days, plan_data, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST : sauvegarder un nouveau plan
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const body = await request.json();
    const { data, error } = await supabase.from("plans").insert({
      user_id: user.id,
      job_title: body.job_title,
      company: body.company,
      job_url: body.job_url,
      job_data: body.job_data,
      company_info: body.company_info,
      profile: body.profile,
      matches: body.matches,
      interview_steps: body.interview_steps,
      interview_date: body.interview_date,
      next_interlocutor: body.next_interlocutor,
      plan_data: body.plan_data,
      completed_days: {},
    }).select().single();

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE : supprimer un plan
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const { id } = await request.json();
    if (!id) return Response.json({ error: "ID manquant" }, { status: 400 });

    const { error } = await supabase
      .from("plans")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PATCH : mettre à jour la progression
export async function PATCH(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const { id, completed_days } = await request.json();
    const { data, error } = await supabase
      .from("plans")
      .update({ completed_days, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}