"use client";
import { useState } from "react";

const T = {
  bg: "#FAF8F5", card: "#FFFFFF", border: "#E8E2D9", text: "#1B2559",
  muted: "#64748B", accent: "#3B82F6", accentLt: "#EFF6FF",
  green: "#10B981", greenLt: "#ECFDF5", red: "#EF4444", redLt: "#FEF2F2",
  warn: "#F59E0B", warnLt: "#FFFBEB",
};

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("users");
  const [data, setData] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAdmin = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin", { headers: { "x-admin-secret": secret } });
      if (!res.ok) throw new Error(res.status === 403 ? "Mauvais secret" : `Erreur ${res.status}`);
      setData(await res.json());
      setAuthed(true);

      // Charger les feedbacks aussi
      const fbRes = await fetch("/api/feedback", { headers: { "x-admin-secret": secret } });
      if (fbRes.ok) setFeedback(await fbRes.json());
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: T.card, padding: 32, borderRadius: 16, border: `1px solid ${T.border}`, maxWidth: 400, width: "100%" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: T.text }}>Admin EntretienZen</h1>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: T.muted }}>Entre le secret admin pour accéder au dashboard</p>
          <input type="password" placeholder="ADMIN_SECRET" value={secret} onChange={(e) => setSecret(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
            onKeyDown={(e) => e.key === "Enter" && fetchAdmin()} />
          <button onClick={fetchAdmin} disabled={loading || !secret}
            style={{ width: "100%", padding: "10px 20px", background: T.accent, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {loading ? "..." : "Accéder"}
          </button>
          {error && <p style={{ color: T.red, fontSize: 13, marginTop: 12 }}>{error}</p>}
        </div>
      </div>
    );
  }

  const { stats, users, recentPlans } = data;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Inter', sans-serif", color: T.text }}>
      <nav style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 18, fontWeight: 800 }}>Admin — EntretienZen</span>
        <button onClick={() => { setAuthed(false); setSecret(""); }} style={{ background: "transparent", border: "none", color: T.muted, cursor: "pointer", fontSize: 13 }}>Déconnexion</button>
      </nav>

      {/* Stats */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Utilisateurs", value: stats.totalUsers, color: T.accent },
            { label: "Confirmés", value: stats.confirmedUsers, color: T.green },
            { label: "Plans créés", value: stats.totalPlans, color: T.warn },
            { label: "Avec plan", value: stats.usersWithPlans, color: T.accent },
            { label: "7 derniers jours", value: stats.recentSignups, color: T.green },
          ].map((s, i) => (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20, background: T.card, borderRadius: 10, padding: 3, border: `1px solid ${T.border}` }}>
          {["users", "plans", "feedback"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, background: tab === t ? T.accent : "transparent", color: tab === t ? "#fff" : T.muted, fontWeight: tab === t ? 700 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              {t === "users" ? `Utilisateurs (${users.length})` : t === "plans" ? `Plans (${recentPlans.length})` : `Feedback (${feedback?.length || 0})`}
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
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Inscription</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Dernière connexion</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>Confirmé</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: "10px 14px", fontWeight: 500 }}>{u.email}</td>
                    <td style={{ padding: "10px 14px", color: T.muted }}>{u.provider}</td>
                    <td style={{ padding: "10px 14px", color: T.muted }}>{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                    <td style={{ padding: "10px 14px", color: T.muted }}>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("fr-FR") : "—"}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>{u.confirmed ? "✅" : "❌"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Plans tab */}
        {tab === "plans" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {recentPlans.map(p => (
              <div key={p.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700 }}>{p.job_title}</h3>
                <p style={{ margin: "0 0 4px", fontSize: 12, color: T.muted }}>{p.company}</p>
                <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{new Date(p.created_at).toLocaleDateString("fr-FR")}</p>
              </div>
            ))}
          </div>
        )}

        {/* Feedback tab */}
        {tab === "feedback" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {!feedback?.length ? (
              <p style={{ textAlign: "center", color: T.muted, padding: 32 }}>Aucun feedback pour le moment</p>
            ) : feedback.map(fb => (
              <div key={fb.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20,
                    background: fb.type === "bug" ? T.redLt : fb.type === "feature" ? T.accentLt : fb.type === "improvement" ? T.warnLt : T.bg,
                    color: fb.type === "bug" ? T.red : fb.type === "feature" ? T.accent : fb.type === "improvement" ? T.warn : T.muted,
                  }}>{fb.type}</span>
                  <span style={{ fontSize: 11, color: T.muted }}>{fb.user_email} — {new Date(fb.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{fb.message}</p>
                {fb.rating && <p style={{ margin: "6px 0 0", fontSize: 12, color: T.warn }}>{"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
