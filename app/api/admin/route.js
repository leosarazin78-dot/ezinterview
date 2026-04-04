import { createServerClient } from "../../lib/supabase";

// GET : récupérer les statistiques admin (utilisateurs, plans, activité)
// Protégé par ADMIN_SECRET dans le header
export async function GET(request) {
  try {
    const adminSecret = request.headers.get("x-admin-secret");
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return Response.json({ error: "Accès refusé" }, { status: 403 });
    }

    const supabase = createServerClient();

    // Récupérer la liste des utilisateurs via Supabase Auth Admin
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (usersError) throw usersError;

    // Formater les données utilisateurs
    const userList = users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      provider: u.app_metadata?.provider || "email",
      confirmed: !!u.email_confirmed_at,
    }));

    // Récupérer les stats des plans
    const { data: planStats, error: planError } = await supabase
      .from("plans")
      .select("id, user_id, job_title, company, created_at");

    if (planError) throw planError;

    // Statistiques globales
    const stats = {
      totalUsers: userList.length,
      confirmedUsers: userList.filter(u => u.confirmed).length,
      totalPlans: planStats?.length || 0,
      usersWithPlans: new Set(planStats?.map(p => p.user_id)).size,
      recentSignups: userList.filter(u => {
        const d = new Date(u.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }).length,
    };

    return Response.json({
      stats,
      users: userList,
      recentPlans: (planStats || [])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20)
        .map(p => ({ id: p.id, job_title: p.job_title, company: p.company, created_at: p.created_at })),
    });
  } catch (err) {
    console.error("Admin API error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
