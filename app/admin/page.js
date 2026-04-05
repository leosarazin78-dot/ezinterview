"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const T = {
  bg: "#FAF8F5", card: "#FFFFFF", border: "#E8E2D9", text: "#1B2559",
  muted: "#64748B", accent: "#3B82F6", accentLt: "#EFF6FF",
  green: "#10B981", greenLt: "#ECFDF5", red: "#EF4444", redLt: "#FEF2F2",
  warn: "#F59E0B", warnLt: "#FFFBEB",
};

const supabase = typeof window !== "undefined"
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null;

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("users");
  const [data, setData] = useState(null);
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch admin data via API
  const fetchAdminData = async (token) => {
    try {
      const res = await fetch("/api/admin", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Erreur ${res.status}`);
      }
      setData(await res.json());
      setAuthed(true);
    } catch (err) {
      setError(err.message);
      setAuthed(false);
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw new Error(authError.message);
      if (!authData.session) throw new Error("Pas de session obtenue");

      setSession(authData.session);
      setEmail("");
      setPassword("");
      await fetchAdminData(authData.session.access_token);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase?.auth.signOut();
    setAuthed(false);
    setSession(null);
    setData(null);
    setError("");
  };

  // Update report status
  const updateReportStatus = async (reportId, newStatus) => {
    if (!session) return;
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Erreur mise à jour");

      // Refetch data
      await fetchAdminData(session.access_token);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: T.card, padding: 32, borderRadius: 16, border: `1px solid ${T.border}`, maxWidth: 400, width: "100%" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: T.text }}>Admin EntretienZen</h1>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: T.muted }}>Connecte-toi avec ton email admin</p>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
            />
            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{ width: "100%", padding: "10px 20px", background: T.accent, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: (loading || !email || !password) ? 0.6 : 1 }}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
          {error && <p style={{ color: T.red, fontSize: 13, marginTop: 12 }}>{error}</p>}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: T.muted }}>Chargement...</p>
      </div>
    );
  }

  const { stats, users, plans, feedback, reports } = data;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter', sans-serif", color: T.text }}>
      <nav style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 18, fontWeight: 800 }}>Admin — EntretienZen</span>
        <button onClick={handleLogout} style={{ background: "transparent", border: "none", color: T.muted, cursor: "pointer", fontSize: 13 }}>Déconnexion</button>
      </nav>

      {/* Stats */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Utilisateurs", value: stats.totalUsers, color: T.accent },
            { label: "Confirmés", value: stats.confirmedUsers, color: T.green },
            { label: "Plans créés", value: stats.totalPlans, color: T.warn },
            { label: "Avec plan", value: stats.usersWithPlans, color: T.accent },
            { label: "Signups 7j", value: stats.recentSignups, color: T.green },
            { label: "Feedbacks", value: stats.feedbackCount, color: T.accent },
            { label: "Reports", value: stats.reportCount, color: T.red },
          ].map((s, i) => (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20, background: T.card, borderRadius: 10, padding: 3, border: `1px solid ${T.border}`, overflowX: "auto" }}>
          {["users", "plans", "feedback", "reports"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: "0 0 auto", padding: "10px 16px", border: "none", borderRadius: 8, background: tab === t ? T.accent : "transparent", color: tab === t ? "#fff" : T.muted, fontWeight: tab === t ? 700 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              {t === "users" ? `Users (${users.length})` : t === "plans" ? `Plans (${plans.length})` : t === "feedback" ? `Feedback (${feedback.length})` : `Reports (${reports.length})`}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === "users" && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Email</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Provider</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Plans</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Inscription</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Dernière connexion</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Confirmé</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const userPlanCount = plans.filter(p => p.user_id === u.id).length;
                  return (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: "10px 14px", fontWeight: 500 }}>{u.email}</td>
                      <td style={{ padding: "10px 14px", color: T.muted }}>{u.provider}</td>
                      <td style={{ padding: "10px 14px", color: T.muted }}>{userPlanCount}</td>
                      <td style={{ padding: "10px 14px", color: T.muted }}>{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                      <td style={{ padding: "10px 14px", color: T.muted }}>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("fr-FR") : "—"}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>{u.confirmed ? "✅" : "❌"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Plans tab */}
        {tab === "plans" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {plans.map(p => {
              const isExpanded = expandedPlanId === p.id;
              return (
                <div key={p.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                  <div onClick={() => setExpandedPlanId(isExpanded ? null : p.id)} style={{ cursor: "pointer" }}>
                    <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700 }}>{p.job_title}</h3>
                    <p style={{ margin: "0 0 4px", fontSize: 12, color: T.muted }}>{p.company}</p>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: T.muted }}>
                      <strong>{p.user_email}</strong>
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, marginTop: 8 }}>
                      <span>Interview: {p.interview_date ? new Date(p.interview_date).toLocaleDateString("fr-FR") : "—"}</span>
                      <span>Créé: {new Date(p.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                    {p.plan_data && (
                      <div style={{ marginTop: 8, fontSize: 11, color: T.accent, fontWeight: 600 }}>
                        {Object.keys(p.plan_data).length} jours
                      </div>
                    )}
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                      {/* Plan Data */}
                      {p.plan_data && (
                        <div style={{ marginBottom: 12 }}>
                          <h4 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: T.accent }}>Plan</h4>
                          {Object.entries(p.plan_data).map(([dayKey, dayItems]) => (
                            <div key={dayKey} style={{ marginBottom: 8, padding: 8, background: T.bg, borderRadius: 6 }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 4 }}>Jour: {dayKey}</div>
                              {Array.isArray(dayItems) ? dayItems.map((item, idx) => (
                                <div key={idx} style={{ fontSize: 10, color: T.muted, marginLeft: 8 }}>- {item.title || JSON.stringify(item).slice(0, 50)}</div>
                              )) : (
                                <div style={{ fontSize: 10, color: T.muted, marginLeft: 8 }}>- {typeof dayItems === "string" ? dayItems : JSON.stringify(dayItems).slice(0, 50)}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Matches */}
                      {p.matches && Object.keys(p.matches).length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <h4 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: T.accent }}>Matches</h4>
                          <div style={{ fontSize: 10, color: T.muted, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 120, overflow: "auto" }}>
                            {JSON.stringify(p.matches, null, 2)}
                          </div>
                        </div>
                      )}

                      {/* Profile */}
                      {p.profile && Object.keys(p.profile).length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <h4 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: T.accent }}>Profil</h4>
                          <div style={{ fontSize: 10, color: T.muted, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 120, overflow: "auto" }}>
                            {JSON.stringify(p.profile, null, 2)}
                          </div>
                        </div>
                      )}

                      {/* Job Data */}
                      {p.job_data && Object.keys(p.job_data).length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <h4 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: T.accent }}>Détails offre</h4>
                          <div style={{ fontSize: 10, color: T.muted, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 120, overflow: "auto" }}>
                            {JSON.stringify(p.job_data, null, 2)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Feedback tab */}
        {tab === "feedback" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {!feedback?.length ? (
              <p style={{ textAlign: "center", color: T.muted, padding: 32 }}>Aucun feedback pour le moment</p>
            ) : feedback.map(fb => (
              <div key={fb.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8, gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                      background: fb.type === "bug" ? T.redLt : fb.type === "feature" ? T.accentLt : fb.type === "improvement" ? T.warnLt : T.bg,
                      color: fb.type === "bug" ? T.red : fb.type === "feature" ? T.accent : fb.type === "improvement" ? T.warn : T.muted,
                    }}>{fb.type}</span>
                    {fb.rating && <span style={{ fontSize: 11, color: T.warn }}>{"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}</span>}
                  </div>
                  <span style={{ fontSize: 11, color: T.muted }}>{fb.user_email} — {new Date(fb.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{fb.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Reports tab */}
        {tab === "reports" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {!reports?.length ? (
              <p style={{ textAlign: "center", color: T.muted, padding: 32 }}>Aucun report pour le moment</p>
            ) : reports.map(r => {
              const statusColor = r.status === "pending" ? T.warn : r.status === "reviewed" ? T.accent : T.green;
              const statusBg = r.status === "pending" ? T.warnLt : r.status === "reviewed" ? T.accentLt : T.greenLt;
              return (
                <div key={r.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8, gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700 }}>{r.item_title || "Signalement"}</h4>
                      <p style={{ margin: "0 0 4px", fontSize: 11, color: T.muted }}>
                        {r.user_email} — {r.plan_job_title && `${r.plan_job_title} @ ${r.plan_company}`}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: statusBg, color: statusColor }}>
                        {r.status}
                      </span>
                      <select
                        value={r.status}
                        onChange={(e) => updateReportStatus(r.id, e.target.value)}
                        style={{ fontSize: 11, padding: "4px 8px", border: `1px solid ${T.border}`, borderRadius: 6, background: T.bg, cursor: "pointer" }}>
                        <option value="pending">pending</option>
                        <option value="reviewed">reviewed</option>
                        <option value="fixed">fixed</option>
                      </select>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}><strong>Raison:</strong> {r.reason}</p>
                  <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{new Date(r.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
