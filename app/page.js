"use client";
import { useState, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase browser client ───
const supabase = typeof window !== "undefined"
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null;

// ─── UNIFIED THEME ───
const T = {
  bg: "#FAF8F5", card: "#FFFFFF", border: "#E8E2D9", text: "#1B2559",
  muted: "#64748B", light: "#94A3B8",
  accent: "#3B82F6", accentLt: "#EFF6FF", accentBd: "#BFDBFE",
  green: "#10B981", greenLt: "#ECFDF5", greenBd: "#A7F3D0",
  warn: "#F59E0B", warnLt: "#FFFBEB", warnBd: "#FDE68A",
  red: "#EF4444", redLt: "#FEF2F2", redBd: "#FECACA",
  purple: "#8B5CF6", purpleLt: "#F5F3FF", purpleBd: "#DDD6FE",
  orange: "#F97316", orangeLt: "#FFF7ED", orangeBd: "#FED7AA",
  pink: "#EC4899", pinkLt: "#FDF2F8", pinkBd: "#FBCFE8",
  r: 12,
};

// ─── Utilities ───
const formatDateFr = (d) => {
  const dt = new Date(d);
  return `${["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][dt.getDay()]} ${dt.getDate()} ${["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"][dt.getMonth()]}`;
};
const addDays = (s, n) => { const d = new Date(s); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; };
const today = () => new Date().toISOString().split("T")[0];

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// ─── safeFetch helper ───
const safeFetch = async (url, opts = {}) => {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`safeFetch error: ${url}`, err);
    throw err;
  }
};

// ─── UI atoms ───
const Badge = ({ children, v = "default" }) => {
  const s = {
    strong: { background: T.greenLt, color: T.green, border: `1px solid ${T.greenBd}` },
    partial: { background: T.warnLt, color: T.warn, border: `1px solid ${T.warnBd}` },
    weak: { background: T.redLt, color: T.red, border: `1px solid ${T.redBd}` },
    default: { background: T.accentLt, color: T.accent, border: `1px solid ${T.accentBd}` },
    tech: { background: T.purpleLt, color: T.purple, border: `1px solid ${T.purpleBd}` },
    info: { background: T.accentLt, color: T.accent, border: `1px solid ${T.accentBd}` },
  };
  return <span style={{ ...s[v] || s.default, padding: "2px 10px", borderRadius: T.r, fontSize: 12, fontWeight: 500, display: "inline-block", lineHeight: "20px" }}>{children}</span>;
};

const Spin = ({ text }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", padding: 32 }}>
    <div style={{ width: 16, height: 16, border: `2px solid ${T.border}`, borderTopColor: T.accent, borderRadius: "50%", animation: "spin .6s linear infinite" }} />
    <span style={{ fontSize: 14, color: T.muted }}>{text}</span>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const Bar = ({ value, max, color = T.accent, h = 6 }) => (
  <div style={{ height: h, borderRadius: T.r, background: "#EDE9E3", overflow: "hidden", width: "100%" }}>
    <div style={{ height: "100%", width: `${max > 0 ? Math.round((value / max) * 100) : 0}%`, borderRadius: T.r, background: color, transition: "width .4s ease" }} />
  </div>
);

// ─── Styles ───
const card = { border: `1px solid ${T.border}`, borderRadius: T.r, padding: 24, marginBottom: 16, background: T.card };
const inp = { width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: T.r, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: T.card, color: T.text };
const btnP = { background: T.accent, color: "#fff", border: "none", borderRadius: T.r, padding: "10px 20px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" };
const btnS = { background: T.card, color: T.text, border: `1px solid ${T.border}`, borderRadius: T.r, padding: "10px 20px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" };
const btnD = { ...btnP, background: "#B5B0A8", cursor: "not-allowed" };
const tabS = (a) => ({ padding: "8px 20px", border: "none", borderBottom: a ? `2px solid ${T.accent}` : "2px solid transparent", background: "transparent", color: a ? T.text : T.muted, fontWeight: a ? 600 : 400, fontSize: 14, cursor: "pointer", fontFamily: "inherit" });
const typeL = { memo: "Memo", video: "Vidéo", exercise: "Labo", note: "Note", quiz: "Quiz" };
const typeV = { memo: "default", video: "info", exercise: "tech", note: "default", quiz: "warn" };

// ─── Quiz Component ───
function QuizBlock({ questions, title }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const score = submitted ? questions.filter((q, i) => answers[i] === q.correct).length : 0;

  return (
    <div style={{ marginTop: 12 }}>
      {title && <h5 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600, color: T.warn }}>{title}</h5>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {questions.map((q, qi) => (
          <div key={qi} style={{ padding: 12, borderRadius: T.r, background: submitted ? (answers[qi] === q.correct ? T.greenLt : T.redLt) : T.accentLt, border: `1px solid ${submitted ? (answers[qi] === q.correct ? T.greenBd : T.redBd) : T.accentBd}` }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 500 }}>{qi + 1}. {q.q}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {q.options?.map((opt, oi) => (
                <label key={oi} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: T.r, cursor: submitted ? "default" : "pointer", fontSize: 13, background: submitted && oi === q.correct ? T.greenLt : submitted && answers[qi] === oi && oi !== q.correct ? T.redLt : answers[qi] === oi ? T.accentLt : "transparent", border: `1px solid ${submitted && oi === q.correct ? T.greenBd : answers[qi] === oi ? T.accentBd : "transparent"}` }}>
                  <input type="radio" name={`quiz-${title}-${qi}`} checked={answers[qi] === oi} onChange={() => !submitted && setAnswers(p => ({ ...p, [qi]: oi }))} disabled={submitted} style={{ accentColor: T.accent }} />
                  {opt}
                </label>
              ))}
            </div>
            {submitted && q.explanation && <p style={{ margin: "8px 0 0", fontSize: 12, color: T.muted, fontStyle: "italic" }}>{q.explanation}</p>}
          </div>
        ))}
      </div>
      {!submitted ? (
        <button style={{ ...btnP, marginTop: 12, fontSize: 13 }} onClick={() => setSubmitted(true)} disabled={Object.keys(answers).length < questions.length}>Valider ({Object.keys(answers).length}/{questions.length})</button>
      ) : (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: T.r, background: score >= questions.length * 0.7 ? T.greenLt : T.warnLt, border: `1px solid ${score >= questions.length * 0.7 ? T.greenBd : T.warnBd}` }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: score >= questions.length * 0.7 ? T.green : T.warn }}>{score}/{questions.length} — {score >= questions.length * 0.7 ? "Bien joué !" : "À revoir"}</span>
          <button style={{ ...btnS, marginLeft: 12, padding: "4px 12px", fontSize: 12 }} onClick={() => { setAnswers({}); setSubmitted(false); }}>Refaire</button>
        </div>
      )}
    </div>
  );
}

// ─── MiniQuiz Component ───
function MiniQuiz({ questions }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  if (!questions?.length) return null;
  const q = questions[current];

  return (
    <div style={{ marginTop: 10, padding: 10, borderRadius: T.r, background: T.warnLt, border: `1px solid ${T.warnBd}` }}>
      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: T.warn }}>Mini-Quiz</p>
      <p style={{ margin: "0 0 6px", fontSize: 13 }}>{q.q}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {q.options?.map((opt, oi) => (
          <button key={oi} onClick={() => { if (!showResult) { setSelected(oi); setShowResult(true); } }}
            style={{ padding: "4px 10px", borderRadius: T.r, fontSize: 12, border: `1px solid ${showResult && oi === q.correct ? T.greenBd : showResult && selected === oi ? T.redBd : T.warnBd}`, background: showResult && oi === q.correct ? T.greenLt : showResult && selected === oi && oi !== q.correct ? T.redLt : T.card, cursor: showResult ? "default" : "pointer", fontFamily: "inherit", color: T.text }}>
            {opt}
          </button>
        ))}
      </div>
      {showResult && current < questions.length - 1 && (
        <button style={{ ...btnS, padding: "3px 10px", fontSize: 11, marginTop: 6 }} onClick={() => { setCurrent(c => c + 1); setSelected(null); setShowResult(false); }}>Suivant</button>
      )}
    </div>
  );
}

// ─── Item Expanded Content ───
function ItemContent({ item }) {
  const c = item.content;
  if (!c) return <p style={{ fontSize: 13, color: T.muted, margin: "8px 0 0" }}>Pas de contenu détaillé.</p>;

  return (
    <div style={{ marginTop: 12 }}>
      {(item.type === "note" || item.type === "memo") && (
        <>
          {c.summary && <p style={{ margin: "0 0 10px", fontSize: 13, lineHeight: 1.6 }}>{c.summary}</p>}
          {c.keyPoints?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: T.accent }}>Points clés</p>
              {c.keyPoints.map((pt, i) => <p key={i} style={{ margin: "0 0 4px", fontSize: 13, paddingLeft: 10 }}>- {pt}</p>)}
            </div>
          )}
          {c.tips?.length > 0 && (
            <div style={{ marginBottom: 10, padding: 10, borderRadius: T.r, background: T.warnLt, border: `1px solid ${T.warnBd}` }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: T.warn }}>Astuces</p>
              {c.tips.map((tip, i) => <p key={i} style={{ margin: "0 0 3px", fontSize: 12 }}>{tip}</p>)}
            </div>
          )}
          {c.links?.length > 0 && <LinksBlock links={c.links} />}
          {item.miniQuiz?.length > 0 && <MiniQuiz questions={item.miniQuiz} />}
        </>
      )}

      {item.type === "exercise" && (
        <>
          {c.objective && <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 500 }}>{c.objective}</p>}
          {c.steps?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: T.purple }}>Étapes</p>
              {c.steps.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 13 }}>
                  <span style={{ color: T.purple, fontWeight: 600, flexShrink: 0 }}>{i + 1}.</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
          {c.tips?.length > 0 && (
            <div style={{ marginBottom: 10, padding: 10, borderRadius: T.r, background: T.purpleLt, border: `1px solid ${T.purpleBd}` }}>
              {c.tips.map((tip, i) => <p key={i} style={{ margin: "0 0 3px", fontSize: 12 }}>{tip}</p>)}
            </div>
          )}
          {c.links?.length > 0 && <LinksBlock links={c.links} />}
        </>
      )}

      {item.type === "quiz" && c.questions?.length > 0 && (
        <QuizBlock questions={c.questions} title={item.title} />
      )}
    </div>
  );
}

// ─── Links Block ───
function LinksBlock({ links }) {
  if (!links?.length) return null;
  const icons = { video: "▶", article: "📄", lab: "🧪", course: "📚" };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
      {links.map((lk, i) => (
        <a key={i} href={lk.url} target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: T.r, fontSize: 12, textDecoration: "none", color: lk.type === "video" ? T.orange : lk.type === "lab" ? T.purple : T.accent, background: lk.type === "video" ? T.orangeLt : lk.type === "lab" ? T.purpleLt : T.accentLt, border: `1px solid ${lk.type === "video" ? T.orangeBd : lk.type === "lab" ? T.purpleBd : T.accentBd}` }}>
          <span>{icons[lk.type] || "🔗"}</span>{lk.label}
        </a>
      ))}
    </div>
  );
}

// ─── Culture Panel ───
function CulturePanel({ companyInfo, jobData }) {
  const ci = companyInfo || jobData?.companyInfo;
  if (!ci) return null;

  return (
    <div style={{ ...card, background: T.accentLt, borderColor: T.accentBd }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: T.accent }}>Culture & Veille — {jobData?.company}</h3>

      {ci.founded && <p style={{ margin: "0 0 8px", fontSize: 13, color: T.muted }}>Fondée en {ci.founded} · {ci.hq} · {ci.employees} employés · {ci.sector}</p>}

      {ci.businessModel && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>Business model</p>
          <p style={{ margin: 0, fontSize: 13 }}>{ci.businessModel}</p>
        </div>
      )}

      {ci.culture && (
        <div style={{ marginBottom: 10, padding: 10, borderRadius: T.r, background: T.card }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: T.accent }}>Culture d'entreprise</p>
          <p style={{ margin: 0, fontSize: 13 }}>{ci.culture}</p>
        </div>
      )}

      {ci.recentNews?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>Actualités</p>
          {ci.recentNews.map((n, i) => <p key={i} style={{ margin: "0 0 3px", fontSize: 12, paddingLeft: 8 }}>— {n}</p>)}
        </div>
      )}

      {ci.competitors?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>Concurrents</p>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{ci.competitors.map(c => <Badge key={c} v="info">{c}</Badge>)}</div>
        </div>
      )}

      {ci.techStack?.length > 0 && (
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>Outils & méthodes</p>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{ci.techStack.map(t => <Badge key={t} v="tech">{t}</Badge>)}</div>
        </div>
      )}
    </div>
  );
}

// ─── Landing Page ───
function LandingPage({ user, onLogin }) {
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [currentDay, setCurrentDay] = useState(0);

  const handleEmail = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin?.();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Vérifie tes emails pour confirmer ton compte !");
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true); setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
      if (error) throw error;
    } catch (err) { setError(err.message); setLoading(false); }
  };

  // Auto-advance mockup days every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDay(d => (d + 1) % 6);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const mockupDays = [
    { day: 1, title: "Fondamentaux React & Hooks", status: "completed", progress: 100 },
    { day: 2, title: "State Management avancé", status: "completed", progress: 100 },
    { day: 3, title: "Tests & Qualité de code", status: "progress", progress: 60 },
    { day: 4, title: "Architecture & Patterns", status: "locked", progress: 0 },
    { day: 5, title: "Culture d'entreprise & Entretien", status: "locked", progress: 0 },
    { day: 6, title: "Révision & Quiz final", status: "locked", progress: 0 },
  ];

  const features = [
    { icon: "📚", title: "Sources fiables, vraiment", desc: "Légifrance, MDN, PubMed, Investopedia, Coursera, docs officielles." },
    { icon: "🎯", title: "Fini le hors-sujet", desc: "Chaque ressource est adaptée à l'offre que TU as fournie." },
    { icon: "🧠", title: "Ton copilote, pas ton remplaçant", desc: "Des quiz, des exercices, des rappels — tu travailles vraiment." },
    { icon: "📈", title: "Progression en temps réel", desc: "Vois exactement où tu en es. Aucune surprise le jour J." },
  ];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: T.text, background: T.bg, minHeight: "100vh", lineHeight: 1.6 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        .ez-card { transition: all 0.2s ease; cursor: pointer; }
        .ez-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.08); }
        .ez-btn { transition: all 0.15s ease; }
        .ez-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59,130,246,0.35); }
        .ez-mockup-day { animation: slideIn 0.5s ease; }
        .ez-mockup-current { animation: pulse 1s ease-in-out infinite; }
        @media (max-width: 768px) {
          .ez-hero-grid { grid-template-columns: 1fr !important; }
          .ez-hero-text h1 { font-size: 32px !important; }
          .ez-hero-text p { font-size: 15px !important; }
          .ez-hero-mockup { display: none !important; }
          .ez-courses-grid { grid-template-columns: 1fr !important; }
          .ez-features-grid { grid-template-columns: 1fr !important; }
          .ez-section { padding-left: 16px !important; padding-right: 16px !important; }
          .ez-nav-inner { padding: 0 16px !important; }
          .ez-cta-box { padding: 40px 24px !important; }
          .ez-cta-box h2 { font-size: 24px !important; }
        }
        @media (max-width: 480px) {
          .ez-hero-text h1 { font-size: 26px !important; }
        }
      `}</style>

      {/* ─── Nav ─── */}
      <nav style={{ background: T.card, borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div className="ez-nav-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>EntretienZen</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {user ? (
              <button onClick={() => onLogin?.()} style={{ background: "transparent", border: "none", color: T.muted, fontSize: 14, fontWeight: 500, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", borderRadius: 8 }}>Mon espace</button>
            ) : (
              <>
                <button onClick={() => setShowAuth(true)} style={{ background: "transparent", border: "none", color: T.muted, fontSize: 14, fontWeight: 500, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", borderRadius: 8 }}>Se connecter</button>
                <button className="ez-btn" onClick={() => setShowAuth(true)} style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>S'inscrire</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
        <div className="ez-hero-grid ez-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div className="ez-hero-text" style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, background: T.accentLt, fontSize: 13, fontWeight: 600, color: T.accent, marginBottom: 32 }}>Nouveau : tous les métiers</div>
            <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1, margin: "0 0 24px", letterSpacing: "-1.5px", color: T.text }}>
              Arrive en entretien avec l'assurance de celui qui a déjà les réponses.
            </h1>
            <p style={{ fontSize: 18, color: T.muted, margin: "0 0 40px", lineHeight: 1.8, maxWidth: 550 }}>
              La plupart des candidats ne savent pas par où commencer. EntretienZen crée un plan de préparation personnalisé, jour par jour, avec sources fiables et quiz adaptés à ton secteur.
            </p>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 48 }}>
              <button className="ez-btn" onClick={() => setShowAuth(true)} style={{ background: T.accent, color: "#fff", border: "none", borderRadius: T.r, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Préparer mon entretien gratuitement
              </button>
              <span style={{ fontSize: 13, color: T.muted }}>Sans carte bancaire</span>
            </div>
          </div>

          <div className="ez-hero-mockup" style={{ animation: "fadeIn 0.7s ease" }}>
            <div style={{ background: T.card, borderRadius: 24, padding: 32, border: `1px solid ${T.border}`, boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20 }}>📋</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Plan de préparation</div>
                  <div style={{ fontSize: 12, color: T.muted }}>Développeur Frontend React</div>
                </div>
              </div>
              {mockupDays.map((d, i) => (
                <div
                  key={i}
                  className={`ez-mockup-day ${i === currentDay ? "ez-mockup-current" : ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: T.r,
                    background: T.card,
                    border: `1px solid ${
                      d.status === "completed"
                        ? T.greenBd
                        : d.status === "progress"
                        ? T.accentBd
                        : T.border
                    }`,
                    marginBottom: 10,
                    opacity: i <= currentDay ? 1 : 0.6,
                    transition: "all 0.4s ease",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background:
                        d.status === "completed"
                          ? T.greenLt
                          : d.status === "progress"
                          ? T.accentLt
                          : "#F1F5F9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color:
                        d.status === "completed"
                          ? T.green
                          : d.status === "progress"
                          ? T.accent
                          : T.muted,
                      flexShrink: 0,
                    }}
                  >
                    {d.status === "completed" ? "✓" : d.status === "progress" ? "▶" : `J${d.day}`}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: d.status === "locked" ? T.muted : T.text,
                      }}
                    >
                      Jour {d.day}
                    </div>
                    <div style={{ fontSize: 12, color: T.muted }}>{d.title}</div>
                  </div>
                  {d.status === "completed" && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.green }}>
                      100%
                    </span>
                  )}
                  {d.status === "progress" && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.accent }}>
                      {d.progress}%
                    </span>
                  )}
                </div>
              ))}
              <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: T.r, background: T.greenLt, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${T.greenBd}` }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.green }}>Progression globale</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: T.green }}>49%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section style={{ background: T.bg, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div className="ez-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, background: T.orangeLt, fontSize: 12, fontWeight: 700, color: T.orange, marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px" }}>Comment ça marche</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: T.text }}>3 étapes simples</h2>
          </div>
          <div className="ez-courses-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
            {[
              { title: "Analyse de l'offre", desc: "L'IA identifie les compétences clés, analyse l'entreprise et ses attentes.", icon: "🔗", n: 1 },
              { title: "Matching CV", desc: "Compare ton profil à l'offre. On identifie tes forces et tes points à travailler.", icon: "📄", n: 2 },
              { title: "Plan de préparation", desc: "Plan jour par jour : cours, exercices, quiz et ressources adaptées à ton métier.", icon: "🎯", n: 3 },
            ].map((c, i) => (
              <div key={i} className="ez-card" style={{ borderRadius: T.r, background: T.card, border: `1px solid ${T.border}`, padding: 32, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: T.r, background: T.accentLt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{c.icon}</div>
                <div>
                  <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, background: T.accentLt, fontSize: 11, fontWeight: 700, color: T.accent, marginBottom: 8, textTransform: "uppercase" }}>Étape {c.n}</div>
                  <h3 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 10px", color: T.text }}>{c.title}</h3>
                  <p style={{ fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6 }}>{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="ez-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 12px", color: T.text }}>Tout pour réussir ton entretien</h2>
          <p style={{ fontSize: 16, color: T.muted, margin: 0, maxWidth: 650, marginLeft: "auto", marginRight: "auto" }}>Des outils complets et une préparation sérieuse, pas des promesses creuses</p>
        </div>
        <div className="ez-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 28 }}>
          {features.map((h, i) => (
            <div key={i} style={{ display: "flex", gap: 20, padding: 32, borderRadius: T.r, background: T.card, border: `1px solid ${T.border}` }}>
              <div style={{ width: 56, height: 56, borderRadius: T.r, background: [T.accentLt, T.accentLt, T.accentLt, T.accentLt][i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>{h.icon}</div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px", color: T.text }}>{h.title}</h3>
                <p style={{ fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6 }}>{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="ez-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px" }}>
        <div className="ez-cta-box" style={{ maxWidth: 700, margin: "0 auto", padding: "64px 48px", borderRadius: 24, background: T.text, color: "#fff", textAlign: "center" }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, margin: "0 0 16px", letterSpacing: "-0.8px" }}>Prêt à décrocher ton poste ?</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.8)", margin: "0 0 32px", lineHeight: 1.7 }}>
            Commence ta préparation gratuitement. Sans carte bancaire, en 2 minutes.
          </p>
          <button className="ez-btn" onClick={() => setShowAuth(true)} style={{ background: T.accent, color: "#fff", border: "none", borderRadius: T.r, padding: "16px 40px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Commencer maintenant
          </button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ borderTop: `1px solid ${T.border}`, background: T.card }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>EntretienZen</span>
          </div>
          <span style={{ fontSize: 13, color: T.muted }}>Open source — 2024-2026</span>
        </div>
      </footer>

      {/* ─── Auth Modal ─── */}
      {showAuth && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(27,37,89,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false); }}>
          <div style={{ maxWidth: 420, width: "100%", background: T.card, borderRadius: 20, padding: 32, position: "relative", boxShadow: "0 24px 64px rgba(0,0,0,0.2)", animation: "fadeIn 0.25s ease" }}>
            <button onClick={() => setShowAuth(false)} style={{ position: "absolute", top: 16, right: 16, background: T.bg, border: "none", fontSize: 16, color: T.muted, cursor: "pointer", fontFamily: "inherit", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}>✕</button>

            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: T.accent, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>
              </div>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.text }}>Bienvenue</h3>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: T.muted }}>Connecte-toi pour préparer ton entretien</p>
            </div>

            <button onClick={handleGoogle} disabled={loading}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px 20px", marginBottom: 20, fontSize: 14, fontWeight: 600, background: T.bg, color: T.text, border: `1px solid ${T.border}`, borderRadius: T.r, cursor: "pointer", fontFamily: "inherit" }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continuer avec Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 20px" }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontSize: 12, color: T.muted }}>ou par email</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            <div style={{ display: "flex", gap: 0, marginBottom: 20, background: T.bg, borderRadius: 10, padding: 3 }}>
              {["login", "signup"].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(""); setMessage(""); }}
                  style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 8, background: mode === m ? T.card : "transparent", color: mode === m ? T.text : T.muted, fontWeight: mode === m ? 600 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {m === "login" ? "Connexion" : "Inscription"}
                </button>
              ))}
            </div>

            <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} />
              <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} style={inp} />
              <button type="submit" disabled={loading || !email || !password || !isValidEmail(email)} style={{ ...(!isValidEmail(email) || !password ? btnD : btnP) }}>
                {loading ? "..." : mode === "login" ? "Connexion" : "S'inscrire"}
              </button>
            </form>

            {error && <p style={{ fontSize: 13, color: T.red, margin: "12px 0 0", textAlign: "center" }}>{error}</p>}
            {message && <p style={{ fontSize: 13, color: T.green, margin: "12px 0 0", textAlign: "center" }}>{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Plans Dashboard ───
function PlansDashboard({ plans, onSelect, onNew, user, onLogout }) {
  return (
    <div style={{ ...card, background: T.accentLt, borderColor: T.accentBd }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>Mes préparations</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: T.muted }}>Continue ou crée une nouvelle</p>
        </div>
        <button onClick={onNew} style={btnP}>Nouveau plan</button>
      </div>

      {!plans?.length ? (
        <p style={{ fontSize: 13, color: T.muted, textAlign: "center", padding: 32 }}>Aucun plan encore. Crée-en un pour commencer !</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {plans.map((plan) => {
            const done = Object.keys(plan.completed_days || {}).length;
            const daysLeft = plan.interview_date ? Math.max(0, Math.ceil((new Date(plan.interview_date) - new Date()) / 86400000)) : null;
            return (
              <div key={plan.id} onClick={() => onSelect(plan.id)} style={{ padding: 16, borderRadius: T.r, background: T.card, border: `1px solid ${T.border}`, cursor: "pointer", transition: "all .2s" }}>
                <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: T.text }}>{plan.job_title}</h3>
                <p style={{ margin: "0 0 12px", fontSize: 12, color: T.muted }}>{plan.company}</p>
                {daysLeft !== null && <p style={{ fontSize: 11, color: T.warn, fontWeight: 600, margin: "0 0 8px" }}>J-{daysLeft}</p>}
                <div style={{ fontSize: 11, color: T.muted }}>Jour {done + 1} / {plan.duration || 7}</div>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={onLogout} style={{ ...btnS, marginTop: 16, width: "100%" }}>Déconnexion</button>
    </div>
  );
}

// ─── Main App ───
export default function EzInterview() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [savedPlans, setSavedPlans] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [view, setView] = useState("landing");

  const [step, setStep] = useState("input");
  const [activeTab, setActiveTab] = useState("offer");
  const [jobUrl, setJobUrl] = useState("");
  const [jobData, setJobData] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState("");
  const [cvText, setCvText] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  const [intensity, setIntensity] = useState("Standard");
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState(null);
  const [planError, setPlanError] = useState("");

  const [expandedDay, setExpandedDay] = useState(0);
  const [expandedItems, setExpandedItems] = useState({});
  const [completedDays, setCompletedDays] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user);
          setView("dashboard");
          setStep("dashboard");
          // Load saved plans
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              const plans = await safeFetch("/api/plans", { headers: { "Authorization": `Bearer ${session.access_token}` } });
              setSavedPlans(plans);
            }
          } catch (e) { console.error("Load plans error:", e); }
        }
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  const fetchJobData = async () => {
    setJobLoading(true); setJobError("");
    try {
      const res = await safeFetch("/api/analyze-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl, experienceLevel }),
      });
      setJobData(res);
      setActiveTab("cv");
    } catch (err) {
      setJobError(err.message);
    } finally {
      setJobLoading(false);
    }
  };

  const analyzeProfile = async () => {
    if (!jobData) return;
    setStatsLoading(true); setStatsError("");
    try {
      const res = await safeFetch("/api/analyze-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobData, cvText, linkedinUrl, experienceLevel }),
      });
      setStats(res);
      setActiveTab("matching");
    } catch (err) {
      setStatsError(err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!stats) return;
    setGenerating(true); setPlanError("");
    try {
      const res = await safeFetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobData, stats, intensity, experienceLevel }),
      });
      setPlan(res);
      setStep("plan");

      // Auto-save to Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await safeFetch("/api/plans", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
            body: JSON.stringify({
              job_title: jobData?.title || jobData?.job_title || "Sans titre",
              company: jobData?.company || "",
              job_url: jobUrl,
              job_data: jobData,
              profile: { cvText, linkedinUrl, experienceLevel },
              matches: stats?.matches || [],
              plan_data: res,
            }),
          });
          // Refresh saved plans
          const plans = await safeFetch("/api/plans", { headers: { "Authorization": `Bearer ${session.access_token}` } });
          setSavedPlans(plans);
        }
      } catch (saveErr) {
        console.error("Auto-save error:", saveErr);
      }
    } catch (err) {
      setPlanError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView("landing");
    setStep("input");
  };

  if (authLoading) return <Spin text="Chargement..." />;

  if (view === "landing") {
    return <LandingPage user={user} onLogin={() => { setView("dashboard"); setStep("dashboard"); }} />;
  }

  if (!user) return <LandingPage />;

  // ─── EDITOR VIEW (when logged in) ───
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: T.text, background: T.bg, minHeight: "100vh", lineHeight: 1.6 }}>
      <style>{`
        @media (max-width: 768px) {
          .ez-plan-sidebar { display: none !important; }
          .ez-plan-main { grid-template-columns: 1fr !important; }
          .ez-step { padding: 16px !important; }
          .ez-input-grid { grid-template-columns: 1fr !important; }
          .ez-stepper { font-size: 12px !important; }
          .ez-stepper button { padding: 10px 4px !important; font-size: 12px !important; }
        }
      `}</style>

      <nav style={{ background: T.card, borderBottom: `1px solid ${T.border}`, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>EntretienZen</span>
        <button onClick={() => setStep("dashboard")} style={btnS}>Mon espace</button>
      </nav>

      {step === "dashboard" && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>
          <PlansDashboard
            plans={savedPlans}
            onSelect={(id) => {
              const found = savedPlans.find(p => p.id === id);
              if (found?.plan_data) {
                setPlan(found.plan_data);
                setJobData(found.job_data);
                setStep("plan");
              }
            }}
            onNew={() => { setStep("input"); setActiveTab("offer"); setPlan(null); setJobData(null); setStats(null); setCvText(""); setCvFile(null); setJobUrl(""); setExperienceLevel(""); }}
            user={user}
            onLogout={handleLogout}
          />
        </div>
      )}

      {step === "input" && (
        <div className="ez-step" style={{ maxWidth: 1100, margin: "0 auto", padding: 32 }}>
          <h1 style={{ margin: "0 0 28px", fontSize: 32, fontWeight: 700, color: T.text }}>Préparer mon entretien</h1>

          {/* ─── Stepper tabs ─── */}
          <div style={{ display: "flex", gap: 0, marginBottom: 32, background: T.card, borderRadius: 14, padding: 4, border: `1px solid ${T.border}` }}>
            {[
              { key: "offer", label: "① Offre", done: !!jobData },
              { key: "cv", label: "② CV", done: !!cvText || !!cvFile },
              { key: "matching", label: "③ Matching", done: !!stats },
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              const isLocked = (tab.key === "cv" && !jobData) || (tab.key === "matching" && (!jobData || (!cvText && !cvFile)));
              return (
                <button key={tab.key}
                  onClick={() => !isLocked && setActiveTab(tab.key)}
                  style={{
                    flex: 1, padding: "12px 0", border: "none", borderRadius: 10,
                    background: isActive ? T.accent : "transparent",
                    color: isActive ? "#fff" : isLocked ? T.light : T.text,
                    fontWeight: isActive ? 700 : 500, fontSize: 14,
                    cursor: isLocked ? "not-allowed" : "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    opacity: isLocked ? 0.5 : 1,
                  }}>
                  {tab.label}
                  <span style={{ color: isActive ? "rgba(255,255,255,0.7)" : T.red, fontSize: 11, fontWeight: 700 }}>*</span>
                  {tab.done && <span style={{ fontSize: 14, color: isActive ? "#fff" : T.green }}>✓</span>}
                </button>
              );
            })}
          </div>

          {/* ─── Tab: Offre ─── */}
          {activeTab === "offer" && (
            <div style={card}>
              <label style={{ display: "block", marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Lien de l'offre <span style={{ color: T.red }}>*</span></label>
              <input type="url" placeholder="https://linkedin.com/jobs/..." value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} style={inp} />

              <label style={{ display: "block", marginTop: 16, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Votre niveau d'expérience dans ce domaine <span style={{ color: T.red }}>*</span></label>
              <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} style={inp}>
                <option value="">Sélectionner...</option>
                <option value="Junior (0-2 ans)">Junior (0-2 ans)</option>
                <option value="Confirmé (3-7 ans)">Confirmé (3-7 ans)</option>
                <option value="Senior (8+ ans)">Senior (8+ ans)</option>
              </select>

              {jobError && <p style={{ color: T.red, fontSize: 13, margin: "12px 0 0" }}>{jobError}</p>}

              <button onClick={fetchJobData} disabled={jobLoading || !jobUrl || !experienceLevel} style={{ ...(!jobUrl || !experienceLevel ? btnD : btnP), marginTop: 16, width: "100%" }}>
                {jobLoading ? "Analyse en cours..." : "Analyser l'offre"}
              </button>

              {jobData && (
                <div style={{ marginTop: 16, padding: 14, borderRadius: T.r, background: T.greenLt, border: `1px solid ${T.greenBd}`, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: T.green, fontSize: 18 }}>✓</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.green }}>Offre analysée : {jobData.title || jobData.job_title}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: T.muted }}>{jobData.company} — Passe à l'onglet CV pour continuer</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Tab: CV ─── */}
          {activeTab === "cv" && (
            <div style={card}>
              <label style={{ display: "block", marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Votre CV <span style={{ color: T.red }}>*</span></label>

              {/* ─── Drag & drop zone ─── */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    setCvFile(file);
                    const reader = new FileReader();
                    reader.onload = (ev) => setCvText(ev.target.result);
                    if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
                      reader.readAsText(file);
                    } else {
                      setCvText(`[Fichier : ${file.name}]`);
                    }
                  }
                }}
                style={{
                  border: `2px dashed ${dragOver ? T.accent : T.border}`,
                  borderRadius: T.r, padding: 32, textAlign: "center",
                  background: dragOver ? T.accentLt : T.bg,
                  cursor: "pointer", transition: "all 0.2s ease", marginBottom: 16,
                }}
                onClick={() => document.getElementById("cv-file-input")?.click()}
              >
                <input id="cv-file-input" type="file" accept=".pdf,.doc,.docx,.txt,.rtf" style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCvFile(file);
                      if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setCvText(ev.target.result);
                        reader.readAsText(file);
                      } else {
                        setCvText(`[Fichier : ${file.name}]`);
                      }
                    }
                  }}
                />
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>📄</div>
                {cvFile ? (
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.green }}>{cvFile.name} — Fichier sélectionné ✓</p>
                ) : (
                  <>
                    <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: T.text }}>Glissez votre CV ici ou cliquez pour parcourir</p>
                    <p style={{ margin: 0, fontSize: 12, color: T.muted }}>PDF, Word, TXT — 10 Mo max</p>
                  </>
                )}
              </div>

              <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 500, color: T.muted }}>Ou collez le texte directement</label>
              <textarea placeholder="Collez le contenu de votre CV ici..." value={cvText} onChange={(e) => setCvText(e.target.value)} style={{ ...inp, minHeight: 100, fontFamily: "monospace", fontSize: 12 }} />

              <label style={{ display: "block", marginTop: 16, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Profil LinkedIn (optionnel)</label>
              <input type="url" placeholder="https://linkedin.com/in/..." value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} style={inp} />

              <button onClick={analyzeProfile} disabled={statsLoading || (!cvText && !cvFile)} style={{ ...((!cvText && !cvFile) ? btnD : btnP), width: "100%", marginTop: 16 }}>
                {statsLoading ? "Analyse en cours..." : "Analyser mon profil"}
              </button>
              {statsError && <p style={{ color: T.red, fontSize: 13, margin: "12px 0 0" }}>{statsError}</p>}
            </div>
          )}

          {/* ─── Tab: Matching ─── */}
          {activeTab === "matching" && stats && (
            <>
              <div style={card}>
                <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: T.text }}>Résultat du matching</h2>
                <div style={{ fontSize: 16, fontWeight: 700, color: stats.overallScore > 70 ? T.green : stats.overallScore > 50 ? T.warn : T.red, margin: "12px 0" }}>
                  {stats.overallScore > 70 ? "Ton profil correspond bien à ce poste ! Quelques ajustements et tu es prêt." : stats.overallScore > 50 ? "Tu as de bonnes bases. Avec une préparation ciblée, tu vas cartonner." : "C'est le moment de progresser ! Chaque expert a commencé quelque part."}
                </div>
                {stats.topStrength && <p style={{ fontSize: 13, color: T.green, margin: "8px 0 0" }}>Force principale : {stats.topStrength}</p>}
                {stats.stats?.improvementTip && <p style={{ fontSize: 13, color: T.accent, margin: "6px 0 0" }}>{stats.stats.improvementTip}</p>}

                {stats.matches?.length > 0 && (
                  <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    {stats.matches.map((m, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: T.r, background: m.match === "strong" ? T.greenLt : m.match === "partial" ? T.warnLt : T.redLt, border: `1px solid ${m.match === "strong" ? T.greenBd : m.match === "partial" ? T.warnBd : T.redBd}` }}>
                        <Badge v={m.match}>{m.match === "strong" ? "Acquis" : m.match === "partial" ? "Partiel" : "À travailler"}</Badge>
                        <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{m.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={card}>
                <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: T.text }}>Intensité de préparation</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {["Léger", "Standard", "Intensif"].map((i) => (
                    <button key={i} onClick={() => setIntensity(i)} style={{ padding: 12, borderRadius: T.r, border: `2px solid ${intensity === i ? T.accent : T.border}`, background: intensity === i ? T.accentLt : T.card, color: T.text, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      {i}<br/><span style={{ fontSize: 11, fontWeight: 400, color: T.muted }}>{i === "Léger" ? "30 min/j" : i === "Standard" ? "1h/j" : "2h+/j"}</span>
                    </button>
                  ))}
                </div>
              </div>

              {generating ? (
                <div style={{ textAlign: "center", padding: 48 }}>
                  <Spin text="" />
                  <h2 style={{ margin: "24px 0 8px", fontSize: 20, fontWeight: 700, color: T.text }}>Création de ton plan personnalisé...</h2>
                  <p style={{ fontSize: 14, color: T.muted, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
                    L'IA analyse les meilleures ressources pour ton profil. Cela peut prendre 1 à 2 minutes.
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
                    {["Analyse des compétences", "Recherche de ressources", "Construction du plan"].map((s, i) => (
                      <span key={i} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: T.accentLt, color: T.accent, border: `1px solid ${T.accentBd}`, animation: `fadeIn ${0.5 + i * 0.3}s ease` }}>{s}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <button onClick={generatePlan} disabled={generating} style={{ ...btnP, width: "100%", marginTop: 16 }}>
                  {generating ? "Génération en cours..." : "Préparer mon plan"}
                </button>
              )}
              {planError && <p style={{ color: T.red, fontSize: 13, margin: "12px 0 0" }}>{planError}</p>}
            </>
          )}
        </div>
      )}

      {step === "plan" && plan && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, padding: 24, maxWidth: "100%", margin: "0 auto" }}>
          <div className="ez-plan-sidebar" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {plan.map((day, i) => (
              <button key={i} onClick={() => setExpandedDay(i)} style={{ padding: "12px 16px", borderRadius: T.r, border: `1px solid ${expandedDay === i ? T.accent : T.border}`, background: expandedDay === i ? T.accentLt : T.card, color: T.text, textAlign: "left", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                Jour {i + 1}
              </button>
            ))}
          </div>

          <div className="ez-plan-main" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            {plan[expandedDay] && (
              <>
                <div style={card}>
                  <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: T.text }}>Jour {expandedDay + 1}</h2>
                  <p style={{ margin: "0 0 16px", fontSize: 13, color: T.muted }}>{plan[expandedDay].title}</p>
                  <p style={{ margin: 0, fontSize: 13, color: T.text }}>{plan[expandedDay].focus}</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {plan[expandedDay].items?.map((item, i) => (
                    <div key={i} style={card}>
                      <div onClick={() => setExpandedItems(p => ({ ...p, [i]: !p[i] }))} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>{item.title}</h3>
                          <p style={{ margin: "4px 0 0", fontSize: 12, color: T.muted }}><Badge v={typeV[item.type] || "default"}>{typeL[item.type] || item.type}</Badge></p>
                        </div>
                        <span style={{ color: T.muted }}>{expandedItems[i] ? "▼" : "▶"}</span>
                      </div>
                      {expandedItems[i] && <ItemContent item={item} />}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}