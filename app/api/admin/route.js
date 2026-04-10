import { createServerClient } from "../../lib/supabase";

// Helper: verify admin access via Supabase auth or fallback to secret
async function verifyAdminAccess(request, supabase) {
  const authHeader = request.headers.get("authorization");
  const adminSecret = request.headers.get("x-admin-secret");

  // Try Bearer token first
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && user) {
      const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);
      if (adminEmails.includes(user.email)) {
        return { authorized: true, user };
      }
      return { authorized: false, error: "Email non autorisé comme admin" };
    }
  }

  // Fallback to admin secret
  if (adminSecret && adminSecret === process.env.ADMIN_SECRET) {
    return { authorized: true, user: null };
  }

  return { authorized: false, error: "Accès refusé" };
}

// GET : récupérer les données admin complètes
export async function GET(request) {
  try {
    const supabase = createServerClient();
    const { authorized, error, user } = await verifyAdminAccess(request, supabase);

    if (!authorized) {
      return Response.json({ error }, { status: 403 });
    }

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

    // Récupérer TOUS les plans avec details complètes
    const { data: allPlans, error: planError } = await supabase
      .from("plans")
      .select("id, user_id, job_title, company, interview_date, created_at, plan_data, job_data, matches, profile")
      .order("created_at", { ascending: false });

    if (planError) throw planError;

    // Ajouter user_email à chaque plan
    const plansWithEmail = (allPlans || []).map(p => {
      const user = userList.find(u => u.id === p.user_id);
      return {
        ...p,
        user_email: user?.email || "unknown",
      };
    });

    // Récupérer TOUS les feedbacks
    const { data: allFeedback, error: feedbackError } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (feedbackError) throw feedbackError;

    // Ajouter user_email si manquant
    const feedbackWithEmail = (allFeedback || []).map(fb => ({
      ...fb,
      user_email: fb.user_email || userList.find(u => u.id === fb.user_id)?.email || "unknown",
    }));

    // Récupérer TOUS les reports
    const { data: allReports, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (reportError) throw reportError;

    // Ajouter user_email et plan info à chaque report
    const reportsWithInfo = (allReports || []).map(r => {
      const userEmail = r.user_email || userList.find(u => u.id === r.user_id)?.email || "unknown";
      const plan = allPlans?.find(p => p.id === r.plan_id);
      return {
        ...r,
        user_email: userEmail,
        plan_job_title: plan?.job_title || null,
        plan_company: plan?.company || null,
      };
    });

    // Statistiques globales
    const stats = {
      totalUsers: userList.length,
      confirmedUsers: userList.filter(u => u.confirmed).length,
      totalPlans: allPlans?.length || 0,
      usersWithPlans: new Set(allPlans?.map(p => p.user_id)).size,
      recentSignups: userList.filter(u => {
        const d = new Date(u.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }).length,
      feedbackCount: allFeedback?.length || 0,
      reportCount: allReports?.length || 0,
    };

    return Response.json({
      stats,
      users: userList,
      plans: plansWithEmail,
      feedback: feedbackWithEmail,
      reports: reportsWithInfo,
    });
  } catch (err) {
    console.error("Admin API error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE : supprimer un utilisateur (et ses données associées)
export async function DELETE(request) {
  try {
    const supabase = createServerClient();
    const { authorized, error } = await verifyAdminAccess(request, supabase);
    if (!authorized) return Response.json({ error }, { status: 403 });

    const { userId, deleteAll } = await request.json();

    if (deleteAll) {
      // Supprimer TOUS les utilisateurs (sauf l'admin connecté)
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) throw listError;

      const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);
      const toDelete = users.filter(u => !adminEmails.includes(u.email));

      let deleted = 0;
      for (const u of toDelete) {
        // Supprimer plans, feedback, reports de cet utilisateur
        await supabase.from("plans").delete().eq("user_id", u.id);
        await supabase.from("feedback").delete().eq("user_id", u.id);
        await supabase.from("reports").delete().eq("user_id", u.id);
        // Supprimer le user auth
        const { error: delError } = await supabase.auth.admin.deleteUser(u.id);
        if (!delError) deleted++;
      }
      return Response.json({ success: true, deleted, total: toDelete.length });
    }

    if (!userId) return Response.json({ error: "userId requis" }, { status: 400 });

    // Supprimer les données associées
    await supabase.from("plans").delete().eq("user_id", userId);
    await supabase.from("feedback").delete().eq("user_id", userId);
    await supabase.from("reports").delete().eq("user_id", userId);
    // Supprimer le user
    const { error: delError } = await supabase.auth.admin.deleteUser(userId);
    if (delError) throw delError;

    return Response.json({ success: true });
  } catch (err) {
    console.error("Admin DELETE error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PATCH : mettre à jour le statut d'un report
export async function PATCH(request) {
  try {
    const supabase = createServerClient();
    const { authorized, error } = await verifyAdminAccess(request, supabase);

    if (!authorized) {
      return Response.json({ error }, { status: 403 });
    }

    const { reportId, status } = await request.json();
    if (!reportId || !status) {
      return Response.json({ error: "reportId et status requis" }, { status: 400 });
    }

    const validStatuses = ["pending", "reviewed", "fixed"];
    if (!validStatuses.includes(status)) {
      return Response.json({ error: `Status doit être parmi: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const { data, error: updateError } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", reportId)
      .select()
      .single();

    if (updateError) throw updateError;

    return Response.json({ success: true, data });
  } catch (err) {
    console.error("Admin PATCH error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
