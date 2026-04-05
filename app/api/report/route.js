import { createServerClient } from "../../lib/supabase";

// POST : signaler une info erronée dans un plan
export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return Response.json({ error: "Non authentifié" }, { status: 401 });

    const { planId, dayIndex, itemIndex, itemTitle, reason } = await request.json();
    if (!reason || reason.trim().length < 3) {
      return Response.json({ error: "Précise le problème" }, { status: 400 });
    }

    const { data, error } = await supabase.from("reports").insert({
      user_id: user.id,
      user_email: user.email,
      plan_id: planId || null,
      day_index: dayIndex,
      item_index: itemIndex,
      item_title: itemTitle || "",
      reason: reason.trim().slice(0, 1000),
      status: "pending",  // pending, reviewed, fixed
      created_at: new Date().toISOString(),
    }).select().single();

    if (error) throw error;
    return Response.json({ success: true, id: data.id });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
