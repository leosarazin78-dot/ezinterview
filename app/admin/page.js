"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const T = {
  bg: "#0A0A0F", bgSoft: "#12121A", card: "#1A1A24",
  bgGlass: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.15)", text: "#F0F0F5", muted: "#8888A0",
  accent: "#7C5CFC", accentLt: "rgba(124,92,252,0.12)", accentBd: "rgba(124,92,252,0.25)",
  accentGradient: "linear-gradient(135deg, #7C5CFC 0%, #5B8DEF 100%)",
  green: "#34D399", greenLt: "rgba(52,211,153,0.12)", greenBd: "rgba(52,211,153,0.25)",
  red: "#F87171", redLt: "rgba(248,113,113,0.12)", redBd: "rgba(248,113,113,0.25)",
  warn: "#FBBF24", warnLt: "rgba(251,191,36,0.12)", warnBd: "rgba(251,191,36,0.25)",
  blue: "#60A5FA", blueLt: "rgba(96,165,250,0.12)", blueBd: "rgba(96,165,250,0.25)",
};

const supabase = typeof window !== "undefined"
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null;

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [authed, setAuthed] = useState(false);
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("users");
  const [data, setData] = useState(null);
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

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

  // Check for existing session on load (after magic link redirect)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          setSession(existingSession);
          await fetchAdminData(existingSession.access_token);
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
      setCheckingSession(false);
    };
    checkSession();

    // Listen for auth state changes (magic link callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === "SIGNED_IN" && newSession) {
        setSession(newSession);
        await fetchAdminData(newSession.access_token);
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

  // Send magic link
  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (magicError) throw new Error(magicError.message);
      setMagicLinkSent(true);
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
    setMagicLinkSent(false);
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

  if (checkingSession) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <p style={{ color: T.muted }}>Vérification de la session...</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: T.card, padding: 32, borderRadius: 16, border: `1px solid ${T.border}`, maxWidth: 400, width: "100%" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: T.text }}>Admin EZE</h1>

          {!magicLinkSent ? (
            <>
              <p style={{ margin: "0 0 6px", fontSize: 13, color: T.muted }}>Connexion sécurisée par lien magique</p>
              <p style={{ margin: "0 0 20px", fontSize: 11, color: T.muted }}>Un email de connexion sera envoyé à ton adresse admin</p>
              <form onSubmit={handleMagicLink}>
                <input
                  type="email"
                  placeholder="Email admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", border: `1px solid ${T.border}`, borderRadius: 12, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12, background: "rgba(255,255,255,0.05)", color: T.text }}
                />
                <button
                  type="submit"
                  disabled={loading || !email}
                  style={{ width: "100%", padding: "12px 20px", background: T.accentGradient, color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: (loading || !email) ? 0.6 : 1, boxShadow: "0 4px 16px rgba(124,92,252,0.25)" }}>
                  {loading ? "Envoi..." : "Recevoir le lien de connexion"}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
              <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600, color: T.green }}>Lien envoyé !</p>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: T.muted }}>Vérifie ta boîte mail ({email}) et clique sur le lien de connexion. Cette page se mettra à jour automatiquement.</p>
              <button onClick={() => { setMagicLinkSent(false); setEmail(""); }} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 16px", fontSize: 12, color: T.muted, cursor: "pointer" }}>
                Renvoyer un lien
              </button>
            </div>
          )}

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
        <span style={{ fontSize: 18, fontWeight: 800 }}>Admin — <span style={{ color: T.accent }}>EZE</span></span>
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

        {/* Analytics & SEO links */}
        <div style={{ marginTop: 16, padding: 16, borderRadius: 16, background: "rgba(124,92,252,0.08)", border: "1px solid rgba(124,92,252,0.2)" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#7C5CFC" }}>Analytics & SEO</h4>

          {/* Open source analytics */}
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Open Source (recommandé)</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <a href="https://cloud.umami.is" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, fontSize: 12, textDecoration: "none", color: "#7C5CFC", background: T.accentLt, border: `1px solid ${T.accentBd}`, fontWeight: 600 }}>📊 Umami Analytics</a>
            <a href="https://eu.posthog.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, fontSize: 12, textDecoration: "none", color: "#F97316", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)", fontWeight: 600 }}>🦔 PostHog</a>
            <a href="https://plausible.io" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, fontSize: 12, textDecoration: "none", color: "#8B5CF6", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", fontWeight: 500 }}>📈 Plausible</a>
          </div>

          {/* Google tools */}
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.5px" }}>Google (SEO & SEA)</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, fontSize: 12, textDecoration: "none", color: "#34D399", background: T.greenLt, border: `1px solid ${T.greenBd}`, fontWeight: 500 }}>🔍 Search Console</a>
            <a href="https://ads.google.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, fontSize: 12, textDecoration: "none", color: "#FBBF24", background: T.warnLt, border: `1px solid ${T.warnBd}`, fontWeight: 500 }}>💰 Google Ads (SEA)</a>
            <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, fontSize: 12, textDecoration: "none", color: "#60A5FA", background: T.blueLt, border: `1px solid ${T.blueBd}`, fontWeight: 500 }}>📉 Google Analytics</a>
          </div>

          {/* Setup instructions */}
          <div style={{ padding: 12, borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, fontSize: 11, color: T.muted, lineHeight: 1.6 }}>
            <p style={{ margin: "0 0 4px", fontWeight: 600, color: T.text }}>Variables Vercel à configurer :</p>
            <p style={{ margin: "0 0 2px" }}><span style={{ color: "#7C5CFC", fontFamily: "monospace" }}>NEXT_PUBLIC_UMAMI_URL</span> + <span style={{ color: "#7C5CFC", fontFamily: "monospace" }}>NEXT_PUBLIC_UMAMI_WEBSITE_ID</span> → Umami (gratuit, sans cookies, RGPD)</p>
            <p style={{ margin: "0 0 2px" }}><span style={{ color: "#F97316", fontFamily: "monospace" }}>NEXT_PUBLIC_POSTHOG_KEY</span> → PostHog (1M events gratuits/mois, replays sessions)</p>
            <p style={{ margin: 0 }}><span style={{ color: "#60A5FA", fontFamily: "monospace" }}>NEXT_PUBLIC_GA_ID</span> → Google Analytics (nécessite consentement cookies)</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20, background: T.card, borderRadius: 10, padding: 3, border: `1px solid ${T.border}`, overflowX: "auto" }}>
          {["users", "plans", "feedback", "reports"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: "0 0 auto", padding: "10px 16px", border: "none", borderRadius: 8, background: tab === t ? T.accentGradient : "transparent", color: tab === t ? "#fff" : T.muted, fontWeight: tab === t ? 700 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", boxShadow: tab === t ? "0 2px 8px rgba(124,92,252,0.3)" : "none" }}>
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
