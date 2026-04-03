"use client";
import { useState, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase browser client ───
const supabase = typeof window !== "undefined"
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null;

// ─── Couleurs pastel ───
const T = {
  bg: "#FBF8F3", card: "#FFFFFF", border: "#E2DDD4", text: "#1A1A1A",
  muted: "#6B6560", light: "#9E9790",
  accent: "#5B6ABF", accentLt: "#E8EBFA", accentBd: "#C5CBF0",
  ok: "#3B8A5A", okBg: "#E6F5EC", okBd: "#B5DFC6",
  warn: "#B8860B", warnBg: "#FFF7E0", warnBd: "#F0DCA0",
  bad: "#C0392B", badBg: "#FDECEB", badBd: "#F5C6C0",
  tech: "#6C4DC4", techBg: "#EDE7FB", techBd: "#D4C8F6",
  info: "#2478A8", infoBg: "#E3F1FA", infoBd: "#B3D9F0",
  quiz: "#B8860B", quizBg: "#FFF5E0", quizBd: "#F0DCA0",
  coral: "#E07A5F", mint: "#52B788", mintBg: "#E9F7EF", mintBd: "#B7E4C7",
  lavender: "#7C6FD4", lavBg: "#EEEAFD", lavBd: "#D4CCF6",
  locked: "#E8E5E0", lockedTxt: "#BAB5AD", r: 4,
};

const formatDateFr = (d) => {
  const dt = new Date(d);
  return `${["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][dt.getDay()]} ${dt.getDate()} ${["jan","fev","mar","avr","mai","jun","jul","aou","sep","oct","nov","dec"][dt.getMonth()]}`;
};
const addDays = (s, n) => { const d = new Date(s); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; };
const today = () => new Date().toISOString().split("T")[0];

// ─── UI atoms ───
const Badge = ({ children, v = "default" }) => {
  const s = {
    strong: { background: T.mintBg, color: T.mint, border: `1px solid ${T.mintBd}` },
    partial: { background: T.warnBg, color: T.warn, border: `1px solid ${T.warnBd}` },
    weak: { background: T.badBg, color: T.coral, border: `1px solid ${T.badBd}` },
    default: { background: "#F0EDE6", color: T.muted, border: `1px solid ${T.border}` },
    tech: { background: T.lavBg, color: T.lavender, border: `1px solid ${T.lavBd}` },
    info: { background: T.infoBg, color: T.info, border: `1px solid ${T.infoBd}` },
    quiz: { background: T.quizBg, color: T.quiz, border: `1px solid ${T.quizBd}` },
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
const typeL = { memo: "Memo", video: "Video", exercise: "Lab", note: "Note", quiz: "Quiz" };
const typeV = { memo: "default", video: "info", exercise: "tech", note: "default", quiz: "quiz" };

// ─── Quiz Component ───
function QuizBlock({ questions, title }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const score = submitted ? questions.filter((q, i) => answers[i] === q.correct).length : 0;

  return (
    <div style={{ marginTop: 12 }}>
      {title && <h5 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600, color: T.quiz }}>{title}</h5>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {questions.map((q, qi) => (
          <div key={qi} style={{ padding: 12, borderRadius: T.r, background: submitted ? (answers[qi] === q.correct ? T.mintBg : T.badBg) : "#FAFAF6", border: `1px solid ${submitted ? (answers[qi] === q.correct ? T.mintBd : T.badBd) : "#EDE9E3"}` }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 500 }}>{qi + 1}. {q.q}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {q.options?.map((opt, oi) => (
                <label key={oi} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: T.r, cursor: submitted ? "default" : "pointer", fontSize: 13, background: submitted && oi === q.correct ? T.mintBg : submitted && answers[qi] === oi && oi !== q.correct ? T.badBg : answers[qi] === oi ? T.accentLt : "transparent", border: `1px solid ${submitted && oi === q.correct ? T.mintBd : answers[qi] === oi ? T.accentBd : "transparent"}` }}>
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
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: T.r, background: score >= questions.length * 0.7 ? T.mintBg : T.warnBg, border: `1px solid ${score >= questions.length * 0.7 ? T.mintBd : T.warnBd}` }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: score >= questions.length * 0.7 ? T.mint : T.warn }}>{score}/{questions.length} — {score >= questions.length * 0.7 ? "Bien joue !" : "A revoir"}</span>
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
    <div style={{ marginTop: 10, padding: 10, borderRadius: T.r, background: T.quizBg, border: `1px solid ${T.quizBd}` }}>
      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: T.quiz }}>Mini-Quiz</p>
      <p style={{ margin: "0 0 6px", fontSize: 13 }}>{q.q}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {q.options?.map((opt, oi) => (
          <button key={oi} onClick={() => { if (!showResult) { setSelected(oi); setShowResult(true); } }}
            style={{ padding: "4px 10px", borderRadius: T.r, fontSize: 12, border: `1px solid ${showResult && oi === q.correct ? T.mintBd : showResult && selected === oi ? T.badBd : T.quizBd}`, background: showResult && oi === q.correct ? T.mintBg : showResult && selected === oi && oi !== q.correct ? T.badBg : T.card, cursor: showResult ? "default" : "pointer", fontFamily: "inherit", color: T.text }}>
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
  if (!c) return <p style={{ fontSize: 13, color: T.muted, margin: "8px 0 0" }}>Pas de contenu detaille.</p>;

  return (
    <div style={{ marginTop: 12 }}>
      {/* Note / Memo */}
      {(item.type === "note" || item.type === "memo") && (
        <>
          {c.summary && <p style={{ margin: "0 0 10px", fontSize: 13, lineHeight: 1.6 }}>{c.summary}</p>}
          {c.keyPoints?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: T.accent }}>Points cles</p>
              {c.keyPoints.map((pt, i) => <p key={i} style={{ margin: "0 0 4px", fontSize: 13, paddingLeft: 10 }}>- {pt}</p>)}
            </div>
          )}
          {c.tips?.length > 0 && (
            <div style={{ marginBottom: 10, padding: 10, borderRadius: T.r, background: T.warnBg, border: `1px solid ${T.warnBd}` }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: T.warn }}>Astuces</p>
              {c.tips.map((tip, i) => <p key={i} style={{ margin: "0 0 3px", fontSize: 12 }}>{tip}</p>)}
            </div>
          )}
          {c.links?.length > 0 && <LinksBlock links={c.links} />}
          {item.miniQuiz?.length > 0 && <MiniQuiz questions={item.miniQuiz} />}
        </>
      )}

      {/* Exercise / Lab */}
      {item.type === "exercise" && (
        <>
          {c.objective && <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 500 }}>{c.objective}</p>}
          {c.steps?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: T.lavender }}>Etapes</p>
              {c.steps.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 13 }}>
                  <span style={{ color: T.lavender, fontWeight: 600, flexShrink: 0 }}>{i + 1}.</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
          {c.tips?.length > 0 && (
            <div style={{ marginBottom: 10, padding: 10, borderRadius: T.r, background: T.lavBg, border: `1px solid ${T.lavBd}` }}>
              {c.tips.map((tip, i) => <p key={i} style={{ margin: "0 0 3px", fontSize: 12 }}>{tip}</p>)}
            </div>
          )}
          {c.links?.length > 0 && <LinksBlock links={c.links} />}
        </>
      )}

      {/* Quiz */}
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
          style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: T.r, fontSize: 12, textDecoration: "none", color: lk.type === "video" ? T.coral : lk.type === "lab" ? T.lavender : T.info, background: lk.type === "video" ? "#FFF0EC" : lk.type === "lab" ? T.lavBg : T.infoBg, border: `1px solid ${lk.type === "video" ? "#F5C6B8" : lk.type === "lab" ? T.lavBd : T.infoBd}` }}>
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
    <div style={{ ...card, background: T.infoBg, borderColor: T.infoBd }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: T.info }}>Culture & Veille — {jobData?.company}</h3>

      {ci.founded && <p style={{ margin: "0 0 8px", fontSize: 13, color: T.muted }}>Fondee en {ci.founded} · {ci.hq} · {ci.employees} employes · {ci.sector}</p>}

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
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>Actualites</p>
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
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>Outils & methodes</p>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{ci.techStack.map(t => <Badge key={t} v="tech">{t}</Badge>)}</div>
        </div>
      )}
    </div>
  );
}

// ─── Landing Page + Auth (AdEspresso-inspired) ───
function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleEmail = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Verifie tes emails pour confirmer ton compte !");
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

  // AdEspresso-inspired: clean white bg, colorful category cards, big illustrations, rounded corners
  const L = {
    white: "#FFFFFF", bg: "#F7F8FC", navy: "#1B2559", blue: "#3B82F6", blueLight: "#EFF6FF",
    orange: "#F97316", orangeLight: "#FFF7ED", green: "#10B981", greenLight: "#ECFDF5",
    purple: "#8B5CF6", purpleLight: "#F5F3FF", pink: "#EC4899", pinkLight: "#FDF2F8",
    gray: "#64748B", grayLight: "#F1F5F9", border: "#E2E8F0", radius: 12,
  };

  const courses = [
    { color: L.blue, bg: L.blueLight, icon: "🔗", tag: "ETAPE 1", title: "Analyse de l'offre", desc: "L'IA scrape l'offre, identifie les competences cles, analyse l'entreprise et ses attentes — tous domaines confondus.", duration: "2 min" },
    { color: L.orange, bg: L.orangeLight, icon: "📄", tag: "ETAPE 2", title: "Matching CV", desc: "Compare ton profil a l'offre. Identifie tes forces et tes points a travailler avec un score detaille.", duration: "3 min" },
    { color: L.green, bg: L.greenLight, icon: "🎯", tag: "ETAPE 3", title: "Plan de preparation", desc: "Plan jour par jour : cours, exercices, quiz et ressources de reference adaptees a ton metier.", duration: "14 jours" },
  ];

  const categories = [
    { name: "Tech & Dev", count: "React, Python, Cloud...", color: L.blue, bg: L.blueLight },
    { name: "Finance & Audit", count: "Comptabilite, Controle...", color: L.green, bg: L.greenLight },
    { name: "Droit & Juridique", count: "Contrats, Compliance...", color: L.purple, bg: L.purpleLight },
    { name: "Marketing & Com", count: "SEO, Branding, Growth...", color: L.pink, bg: L.pinkLight },
    { name: "Sante & Medical", count: "Clinique, Pharma...", color: L.orange, bg: L.orangeLight },
    { name: "RH & Management", count: "Recrutement, People...", color: L.blue, bg: L.blueLight },
  ];

  const highlights = [
    { icon: "📚", title: "Sources de verite", desc: "2-3 references fiables par item : Legifrance, MDN, PubMed, Investopedia, Coursera, docs officielles..." },
    { icon: "🧠", title: "Quiz interactifs", desc: "QCM corriges a chaque etape, mini-quiz dans les cours, examen final. Tu sais exactement ou tu en es." },
    { icon: "🏢", title: "Intel entreprise", desc: "Fiche complete : actualites, concurrents, culture d'entreprise, outils utilises. Arrive prepare." },
    { icon: "📈", title: "Progression guidee", desc: "Deblocage sequentiel, barres de progression, scores en temps reel. Un coaching structure jusqu'au jour J." },
  ];

  const testimonials = [
    { text: "5 jours de preparation et j'ai decroche mon poste de Data Analyst. Les quiz sont top pour consolider.", name: "Sarah M.", role: "Data Analyst — BNP Paribas", color: L.blue },
    { text: "Parfaitement adapte au juridique. Les references Legifrance et Dalloz etaient pertinentes.", name: "Thomas L.", role: "Juriste — Groupe Renault", color: L.purple },
    { text: "Enfin un outil pas que pour les devs ! Mon plan marketing digital etait hyper complet.", name: "Camille R.", role: "Chef de projet — Publicis", color: L.pink },
  ];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: L.navy, background: L.bg, minHeight: "100vh", lineHeight: 1.6 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .ez-card { transition: all 0.2s ease; cursor: pointer; }
        .ez-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.08); }
        .ez-btn { transition: all 0.15s ease; }
        .ez-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59,130,246,0.35); }
        .ez-cat:hover { transform: scale(1.03); }
        .ez-cat { transition: all 0.15s ease; cursor: default; }
      `}</style>

      {/* ─── Nav ─── */}
      <nav style={{ background: L.white, borderBottom: `1px solid ${L.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: L.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>
            </div>
            <span style={{ fontSize: 20, fontWeight: 800, color: L.navy, letterSpacing: "-0.5px" }}>EzInterview</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => setShowAuth(true)} style={{ background: "transparent", border: "none", color: L.gray, fontSize: 14, fontWeight: 500, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", borderRadius: 8 }}>Se connecter</button>
            <button className="ez-btn" onClick={() => setShowAuth(true)} style={{ background: L.blue, color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>S'inscrire gratuitement</button>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{ background: L.white, borderBottom: `1px solid ${L.border}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "80px 32px 64px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          {/* Left: text */}
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, background: L.blueLight, fontSize: 13, fontWeight: 600, color: L.blue, marginBottom: 24 }}>Nouveau : IA adaptee a tous les metiers</div>
            <h1 style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: "-1.5px", color: L.navy }}>
              Prepare ton entretien comme un pro.
            </h1>
            <p style={{ fontSize: 17, color: L.gray, margin: "0 0 32px", lineHeight: 1.7, maxWidth: 440 }}>
              Colle le lien de l'offre, upload ton CV. Notre IA cree un plan de preparation personnalise avec des cours, des quiz et des exercices — quel que soit ton domaine.
            </p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button className="ez-btn" onClick={() => setShowAuth(true)} style={{ background: L.blue, color: "#fff", border: "none", borderRadius: 10, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Commencer maintenant
              </button>
              <span style={{ fontSize: 13, color: L.gray }}>Gratuit, sans carte bancaire</span>
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 36 }}>
              {[{ n: "14 jours", l: "de plan max" }, { n: "100+", l: "sources fiables" }, { n: "Tous", l: "les metiers" }].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: L.navy }}>{s.n}</div>
                  <div style={{ fontSize: 12, color: L.gray }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: mockup card */}
          <div style={{ animation: "fadeIn 0.7s ease" }}>
            <div style={{ background: L.bg, borderRadius: 16, padding: 24, border: `1px solid ${L.border}`, boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
              {/* Mini plan card */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: L.blue, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18 }}>📋</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: L.navy }}>Plan de preparation</div>
                  <div style={{ fontSize: 12, color: L.gray }}>Genere en 30 secondes par l'IA</div>
                </div>
              </div>
              {/* Day items */}
              {["Fondamentaux du poste", "Competences techniques", "Culture d'entreprise", "Simulation d'entretien", "Revision & Quiz final"].map((day, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: L.white, border: `1px solid ${i <= 1 ? L.green : i === 2 ? L.blue : L.border}`, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: i <= 1 ? L.greenLight : i === 2 ? L.blueLight : L.grayLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: i <= 1 ? L.green : i === 2 ? L.blue : L.gray }}>
                    {i <= 1 ? "✓" : i === 2 ? "▶" : `J${i + 1}`}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: i > 2 ? L.gray : L.navy }}>Jour {i + 1} — {day}</div>
                  </div>
                  {i <= 1 && <span style={{ fontSize: 11, fontWeight: 600, color: L.green }}>100%</span>}
                  {i === 2 && <span style={{ fontSize: 11, fontWeight: 600, color: L.blue }}>45%</span>}
                </div>
              ))}
              {/* Progress */}
              <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: L.greenLight, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: L.green }}>Progression globale</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: L.green }}>49%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Categories (AdEspresso style) ─── */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "64px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.5px", color: L.navy }}>Adapte a tous les domaines</h2>
          <p style={{ fontSize: 15, color: L.gray, margin: 0 }}>Nos plans s'adaptent a ton secteur avec des ressources specialisees</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {categories.map((c, i) => (
            <div key={i} className="ez-cat" style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", borderRadius: L.radius, background: L.white, border: `1px solid ${L.border}` }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color }}></div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: L.navy }}>{c.name}</div>
                <div style={{ fontSize: 12, color: L.gray }}>{c.count}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works — Course cards (AdEspresso style) ─── */}
      <section style={{ background: L.white, borderTop: `1px solid ${L.border}`, borderBottom: `1px solid ${L.border}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "64px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, background: L.orangeLight, fontSize: 12, fontWeight: 700, color: L.orange, marginBottom: 12, textTransform: "uppercase", letterSpacing: "1px" }}>Comment ca marche</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: L.navy }}>3 etapes simples</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {courses.map((c, i) => (
              <div key={i} className="ez-card" style={{ borderRadius: L.radius, background: L.white, border: `1px solid ${L.border}`, overflow: "hidden" }}>
                {/* Colored top bar */}
                <div style={{ height: 4, background: c.color }}></div>
                <div style={{ padding: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: L.radius, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{c.icon}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c.color, letterSpacing: "1px" }}>{c.tag}</span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: L.navy }}>{c.title}</h3>
                  <p style={{ fontSize: 14, color: L.gray, margin: "0 0 16px", lineHeight: 1.6 }}>{c.desc}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    <span style={{ fontSize: 12, fontWeight: 600, color: c.color }}>{c.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "64px 32px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: L.navy }}>Tout pour reussir ton entretien</h2>
          <p style={{ fontSize: 15, color: L.gray, margin: 0 }}>Des outils complets pour une preparation serieuse et efficace</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {highlights.map((h, i) => (
            <div key={i} style={{ display: "flex", gap: 16, padding: 24, borderRadius: L.radius, background: L.white, border: `1px solid ${L.border}` }}>
              <div style={{ width: 48, height: 48, borderRadius: L.radius, background: [L.blueLight, L.purpleLight, L.orangeLight, L.greenLight][i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{h.icon}</div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", color: L.navy }}>{h.title}</h3>
                <p style={{ fontSize: 13, color: L.gray, margin: 0, lineHeight: 1.6 }}>{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section style={{ background: L.white, borderTop: `1px solid ${L.border}`, borderBottom: `1px solid ${L.border}` }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "64px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 8px", color: L.navy }}>Ils ont decroche leur poste</h2>
            <p style={{ fontSize: 15, color: L.gray, margin: 0 }}>Rejoins des centaines de candidats satisfaits</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ padding: 24, borderRadius: L.radius, background: L.bg, border: `1px solid ${L.border}` }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#FBBF24", fontSize: 16 }}>★</span>)}
                </div>
                <p style={{ fontSize: 14, color: L.gray, margin: "0 0 20px", lineHeight: 1.65, fontStyle: "italic" }}>"{t.text}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 700 }}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: L.navy }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: L.gray }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "80px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "56px 40px", borderRadius: 20, background: L.navy, color: "#fff" }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, margin: "0 0 12px", letterSpacing: "-0.8px" }}>Pret a decrocher ton poste ?</h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", margin: "0 0 28px", lineHeight: 1.6 }}>
            Commence ta preparation gratuitement. Sans carte bancaire, en 2 minutes.
          </p>
          <button className="ez-btn" onClick={() => setShowAuth(true)} style={{ background: L.blue, color: "#fff", border: "none", borderRadius: 10, padding: "16px 40px", fontSize: 17, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Commencer maintenant
          </button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ borderTop: `1px solid ${L.border}`, background: L.white }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: L.blue, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: L.navy }}>EzInterview</span>
          </div>
          <span style={{ fontSize: 12, color: L.gray }}>Open source — 2024-2026</span>
        </div>
      </footer>

      {/* ─── Auth Modal ─── */}
      {showAuth && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false); }}>
          <div style={{ maxWidth: 420, width: "100%", background: L.white, borderRadius: 16, padding: 32, position: "relative", boxShadow: "0 24px 64px rgba(0,0,0,0.2)", animation: "fadeIn 0.25s ease" }}>
            <button onClick={() => setShowAuth(false)} style={{ position: "absolute", top: 16, right: 16, background: L.bg, border: "none", fontSize: 16, color: L.gray, cursor: "pointer", fontFamily: "inherit", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}>✕</button>

            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: L.blue, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>
              </div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: L.navy }}>Bienvenue</h3>
              <p style={{ margin: "4px 0 0", fontSize: 14, color: L.gray }}>Connecte-toi pour preparer ton entretien</p>
            </div>

            <button onClick={handleGoogle} disabled={loading}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 20px", marginBottom: 20, fontSize: 14, fontWeight: 600, background: L.white, color: L.navy, border: `1px solid ${L.border}`, borderRadius: 10, cursor: "pointer", fontFamily: "inherit" }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continuer avec Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 20px" }}>
              <div style={{ flex: 1, height: 1, background: L.border }} />
              <span style={{ fontSize: 12, color: L.gray }}>ou par email</span>
              <div style={{ flex: 1, height: 1, background: L.border }} />
            </div>

            <div style={{ display: "flex", gap: 0, marginBottom: 20, background: L.bg, borderRadius: 10, padding: 3 }}>
              {["login", "signup"].map(m => (
                <button key={m} onClick={() => { setMode(m); setError(""); setMessage(""); }}
                  style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 8, background: mode === m ? L.white : "transparent", color: mode === m ? L.navy : L.gray, fontWeight: mode === m ? 600 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
                  {m === "login" ? "Connexion" : "Inscription"}
                </button>
              ))}
            </div>

            <form onSubmit={handleEmail}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: L.gray, display: "block", marginBottom: 5 }}>Email</label>
                <input style={{ width: "100%", padding: "11px 14px", border: `1px solid ${L.border}`, borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: L.white, color: L.navy }} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ton@email.com" required />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: L.gray, display: "block", marginBottom: 5 }}>Mot de passe</label>
                <input style={{ width: "100%", padding: "11px 14px", border: `1px solid ${L.border}`, borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: L.white, color: L.navy }} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 caracteres" required minLength={6} />
              </div>
              {error && <div style={{ padding: "10px 14px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", fontSize: 13, marginBottom: 14 }}>{error}</div>}
              {message && <div style={{ padding: "10px 14px", borderRadius: 8, background: L.greenLight, border: `1px solid #A7F3D0`, color: L.green, fontSize: 13, marginBottom: 14 }}>{message}</div>}
              <button type="submit" className="ez-btn" style={{ width: "100%", background: L.blue, color: "#fff", border: "none", borderRadius: 10, padding: "12px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }} disabled={loading}>{loading ? "..." : mode === "login" ? "Se connecter" : "Creer mon compte"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Plans Dashboard ───
function PlansDashboard({ plans, onSelect, onNew, user, onLogout }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Mes preparations</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: T.muted }}>{user.email}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btnP} onClick={onNew}>Nouvelle preparation</button>
          <button style={btnS} onClick={onLogout}>Deconnexion</button>
        </div>
      </div>

      {plans.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 48 }}>
          <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>Aucune preparation</p>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>Commence par ajouter une offre d'emploi</p>
          <button style={btnP} onClick={onNew}>Creer ma premiere preparation</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {plans.map(plan => {
            const total = plan.plan_data?.length || 0;
            const done = Object.keys(plan.completed_days || {}).length;
            const daysLeft = plan.interview_date ? Math.max(0, Math.ceil((new Date(plan.interview_date) - new Date()) / 86400000)) : null;
            return (
              <div key={plan.id} onClick={() => onSelect(plan)} style={{ ...card, cursor: "pointer", marginBottom: 0, transition: "border-color .15s" }} onMouseEnter={e => e.currentTarget.style.borderColor = T.accent} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{plan.job_title}</h3>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: T.muted }}>{plan.company}{plan.next_interlocutor ? ` — ${plan.next_interlocutor}` : ""}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {daysLeft !== null && <div style={{ fontSize: 13, fontWeight: 600, color: daysLeft <= 2 ? T.coral : T.accent }}>{daysLeft}j restants</div>}
                    {plan.interview_date && <div style={{ fontSize: 11, color: T.light }}>{formatDateFr(plan.interview_date)}</div>}
                  </div>
                </div>
                {total > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: T.muted }}>{done}/{total} jours</span>
                      <span style={{ fontSize: 12, color: T.accent }}>{Math.round((done / total) * 100)}%</span>
                    </div>
                    <Bar value={done} max={total} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ───
export default function EzInterview() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [savedPlans, setSavedPlans] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [view, setView] = useState("dashboard"); // dashboard | editor

  // Flow state
  const [step, setStep] = useState("input");
  const [activeTab, setActiveTab] = useState("offer");
  const [jobUrl, setJobUrl] = useState("");
  const [jobData, setJobData] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState("");
  const [cvText, setCvText] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [extras, setExtras] = useState("");
  const [profile, setProfile] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [matches, setMatches] = useState([]);
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [interviewDate, setInterviewDate] = useState("");
  const [nextInterlocutor, setNextInterlocutor] = useState("");
  const [prepPlan, setPrepPlan] = useState([]);
  const [expandedDay, setExpandedDay] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [interviewSteps, setInterviewSteps] = useState([]);
  const [manualStepMode, setManualStepMode] = useState(false);
  const [newStepLabel, setNewStepLabel] = useState("");
  const [newStepPerson, setNewStepPerson] = useState("");
  const [newStepType, setNewStepType] = useState("visio");
  const [focusedStep, setFocusedStep] = useState(null);
  const [completedDays, setCompletedDays] = useState({});
  const [error, setError] = useState("");

  // ─── Auth listener ───
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session?.user) { setView("dashboard"); setSavedPlans([]); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ─── Load saved plans ───
  useEffect(() => {
    if (!user) return;
    const loadPlans = async () => {
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch("/api/plans", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { try { setSavedPlans(await res.json()); } catch { /* ignore parse errors */ } }
      } catch (err) { console.error("Load plans error:", err); }
    };
    loadPlans();
  }, [user]);

  // ─── Save plan to DB ───
  const savePlan = async (planData) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          job_title: jobData?.title || "Sans titre",
          company: jobData?.company || "Inconnue",
          job_url: jobUrl,
          job_data: jobData,
          company_info: companyInfo,
          profile,
          matches,
          interview_steps: interviewSteps,
          interview_date: interviewDate,
          next_interlocutor: nextInterlocutor,
          plan_data: planData,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setCurrentPlanId(saved.id);
        setSavedPlans(p => [saved, ...p]);
      }
    } catch (err) { console.error("Save plan error:", err); }
  };

  // ─── Update progress in DB ───
  const updateProgress = async (newCompleted) => {
    if (!currentPlanId) return;
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      await fetch("/api/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: currentPlanId, completed_days: newCompleted }),
      });
    } catch (err) { console.error("Update progress error:", err); }
  };

  // ─── Safe fetch helper ───
  const safeFetch = async (url, options) => {
    const res = await fetch(url, options);
    let data;
    const text = await res.text();
    try { data = JSON.parse(text); } catch { data = { error: text || `Erreur serveur (${res.status})` }; }
    if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
    return data;
  };

  // ─── API calls ───
  const handleFetchJob = useCallback(async () => {
    if (!jobUrl.trim()) return;
    // Basic URL validation
    try { new URL(jobUrl.trim()); } catch { setJobError("URL invalide"); return; }
    setJobLoading(true); setJobError("");
    try {
      const data = await safeFetch("/api/scrape-job", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl.trim().slice(0, 2000) }),
      });
      setJobData(data);
      if (data.interviewSteps?.length > 0) {
        setInterviewSteps(data.interviewSteps);
        setManualStepMode(false);
        setNextInterlocutor(data.interviewSteps[0].interlocutor || "");
      } else { setManualStepMode(true); }
      if (data.company) {
        safeFetch("/api/company-intel", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company: data.company, sector: data.companyInfo?.sector }),
        }).then(info => { if (!info.error) setCompanyInfo(info); }).catch(() => {});
      }
    } catch (err) { setJobError(err.message); }
    setJobLoading(false);
  }, [jobUrl]);

  const handleAnalyze = async () => {
    if (!jobData || (!cvText.trim() && !cvFile)) return;
    setAnalysisLoading(true); setStep("analysis"); setError("");
    try {
      let profileData = profile;
      if (!profileData) {
        const formData = new FormData();
        if (cvFile) formData.append("file", cvFile);
        else formData.append("text", cvText.slice(0, 50000));
        if (linkedinUrl) formData.append("linkedin", linkedinUrl.slice(0, 500));
        const cvRes = await fetch("/api/parse-cv", { method: "POST", body: formData });
        const cvText2 = await cvRes.text();
        let cvData; try { cvData = JSON.parse(cvText2); } catch { throw new Error("Erreur de lecture du CV. Reessaie."); }
        if (!cvRes.ok) throw new Error(cvData.error || "Erreur parsing CV");
        setProfile(cvData);
        profileData = cvData;
      }
      const data = await safeFetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobData, profile: profileData, extras: extras.slice(0, 5000) }),
      });
      setMatches(data);
    } catch (err) { setError(err.message); }
    setAnalysisLoading(false);
  };

  const handleGeneratePlan = async () => {
    if (selectedPriorities.length === 0 || !interviewDate) return;
    setPlanLoading(true); setError("");
    try {
      const data = await safeFetch("/api/generate-plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobData, matches, priorities: selectedPriorities, interviewDate, nextInterlocutor, companyInfo }),
      });
      setPrepPlan(data);
      setStep("plan");
      await savePlan(data);
    } catch (err) { setError(err.message); }
    setPlanLoading(false);
  };

  const handleAddManualStep = () => {
    if (!newStepLabel.trim()) return;
    const ns = { step: interviewSteps.length + 1, label: newStepLabel.trim(), interlocutor: newStepPerson.trim() || "Non precise", duration: "", type: newStepType };
    setInterviewSteps(p => [...p, ns]);
    if (interviewSteps.length === 0) setNextInterlocutor(ns.interlocutor);
    setNewStepLabel(""); setNewStepPerson(""); setNewStepType("visio");
  };

  const togglePriority = (id) => setSelectedPriorities(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleItemExpand = (dayIdx, itemIdx) => {
    const key = `${dayIdx}-${itemIdx}`;
    setExpandedItems(p => ({ ...p, [key]: !p[key] }));
  };

  const toggleDayComplete = (d) => {
    if (d > 1 && !completedDays[d - 1]) return;
    setCompletedDays(p => {
      const n = { ...p };
      if (n[d]) { for (let i = d; i <= prepPlan.length; i++) delete n[i]; }
      else n[d] = true;
      updateProgress(n);
      return n;
    });
  };

  const resetFlow = () => {
    setStep("input"); setActiveTab("offer"); setJobUrl(""); setJobData(null); setCvText(""); setCvFile(null);
    setLinkedinUrl(""); setExtras(""); setProfile(null); setCompanyInfo(null); setMatches([]); setSelectedPriorities([]);
    setInterviewDate(""); setNextInterlocutor(""); setPrepPlan([]); setExpandedDay(null); setExpandedItems({});
    setInterviewSteps([]); setManualStepMode(false); setCompletedDays({}); setCurrentPlanId(null); setError("");
  };

  const loadSavedPlan = (plan) => {
    setCurrentPlanId(plan.id);
    setJobData(plan.job_data || { title: plan.job_title, company: plan.company });
    setJobUrl(plan.job_url || "");
    setCompanyInfo(plan.company_info);
    setProfile(plan.profile);
    setMatches(plan.matches || []);
    setInterviewSteps(plan.interview_steps || []);
    setInterviewDate(plan.interview_date || "");
    setNextInterlocutor(plan.next_interlocutor || "");
    setPrepPlan(plan.plan_data || []);
    setCompletedDays(plan.completed_days || {});
    setExpandedDay(null); setExpandedItems({});
    setStep("plan");
    setView("editor");
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const isInputComplete = jobData && (cvText.trim() || cvFile);
  const getPlanDate = (idx) => { if (!interviewDate) return ""; return addDays(interviewDate, -(prepPlan.length) + idx); };
  const completedCount = Object.keys(completedDays).length;
  const daysUntil = interviewDate ? Math.max(0, Math.ceil((new Date(interviewDate) - new Date()) / 86400000)) : 0;

  const ErrorBanner = ({ msg }) => msg ? (
    <div style={{ padding: "10px 14px", borderRadius: T.r, background: T.badBg, border: `1px solid ${T.badBd}`, color: T.bad, fontSize: 13, marginBottom: 12 }}>{msg}</div>
  ) : null;

  // ─── Auth loading ───
  if (authLoading) return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 740, margin: "0 auto", padding: "24px 16px", color: T.text, background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin text="Chargement..." />
    </div>
  );

  // ─── Not logged in → Landing page ───
  if (!user) return <LandingPage />;

  const goBack = () => {
    if (step === "analysis") { setStep("input"); setError(""); }
    else if (step === "plan") { setStep("analysis"); setPrepPlan([]); setCompletedDays({}); setExpandedDay(null); setExpandedItems({}); }
  };

  // ─── Step indicator (cliquable) ───
  const Steps = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
      {[
        { k: "input", l: "1. Informations", d: step !== "input" },
        { k: "analysis", l: "2. Analyse", d: step === "plan" },
        { k: "plan", l: "3. Plan", d: false },
      ].map((s, i, a) => {
        const canClick = s.d;
        return (
          <div key={s.k} style={{ display: "flex", alignItems: "center" }}>
            <div onClick={() => { if (canClick) setStep(s.k); }} style={{
              padding: "6px 14px", borderRadius: T.r, fontSize: 13,
              background: s.k === step ? T.accent : s.d ? T.mintBg : "#EDEAE4",
              color: s.k === step ? "#fff" : s.d ? T.mint : T.muted,
              fontWeight: s.k === step ? 600 : 400,
              border: `1px solid ${s.k === step ? T.accent : s.d ? T.mintBd : T.border}`,
              cursor: canClick ? "pointer" : "default",
            }}>{s.d ? "OK " : ""}{s.l}</div>
            {i < a.length - 1 && <div style={{ width: 32, height: 1, background: T.border, margin: "0 4px" }} />}
          </div>
        );
      })}
    </div>
  );

  // ─── STEP 1 ───
  const step1 = () => (
    <>
      <div style={{ borderBottom: `1px solid ${T.border}`, marginBottom: 20, display: "flex", gap: 4 }}>
        <button style={tabS(activeTab === "offer")} onClick={() => setActiveTab("offer")}>Offre d'emploi{jobData ? " OK" : ""}</button>
        <button style={tabS(activeTab === "profile")} onClick={() => setActiveTab("profile")}>Mon profil{(cvText.trim() || cvFile) ? " OK" : ""}</button>
      </div>

      {activeTab === "offer" && (
        <>
          <div style={card}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Lien de l'offre</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: T.muted }}>LinkedIn, Indeed, Welcome to the Jungle, site entreprise...</p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input style={{ ...inp, flex: 1 }} placeholder="https://linkedin.com/jobs/view/..." value={jobUrl} onChange={e => setJobUrl(e.target.value)} />
              <button style={jobUrl.trim() ? btnP : btnD} onClick={handleFetchJob} disabled={!jobUrl.trim() || jobLoading}>{jobLoading ? "..." : "Extraire"}</button>
            </div>
            {jobLoading && <Spin text="Extraction du poste..." />}
            <ErrorBanner msg={jobError} />
            {jobData && !jobLoading && (
              <div style={{ border: `1px solid ${T.mintBd}`, borderRadius: T.r, padding: 16, background: T.mintBg }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{jobData.title}</h4>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: T.muted }}>{jobData.company} · {jobData.location}</p>
                  </div>
                  <Badge>{jobData.type}</Badge>
                </div>
                <p style={{ margin: "8px 0", fontSize: 13 }}>{jobData.description}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {jobData.requirements?.map((r, i) => <Badge key={i} v="tech">{r.label}</Badge>)}
                </div>
                {(companyInfo || jobData.companyInfo) && (
                  <div style={{ marginTop: 16, borderTop: `1px solid ${T.mintBd}`, paddingTop: 12 }}>
                    <div style={{ cursor: "pointer", display: "flex", justifyContent: "space-between" }} onClick={() => setShowCompanyInfo(!showCompanyInfo)}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Infos entreprise & actualites</span>
                      <span style={{ fontSize: 12, color: T.muted }}>{showCompanyInfo ? "Masquer" : "Voir"}</span>
                    </div>
                    {showCompanyInfo && (() => {
                      const ci = companyInfo || jobData.companyInfo;
                      return (
                        <div style={{ marginTop: 10, fontSize: 13 }}>
                          <p style={{ margin: "0 0 6px", color: T.muted }}>{ci.founded && `Fondee en ${ci.founded} · `}{ci.hq} · {ci.employees} employes · {ci.sector}</p>
                          {ci.recentNews?.length > 0 && <><p style={{ margin: "0 0 4px", fontWeight: 500, fontSize: 12 }}>Actualites :</p>{ci.recentNews.map((n, i) => <p key={i} style={{ margin: "0 0 3px", fontSize: 12, paddingLeft: 8 }}>— {n}</p>)}</>}
                          {ci.competitors?.length > 0 && <><p style={{ margin: "8px 0 4px", fontWeight: 500, fontSize: 12 }}>Concurrents :</p><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{ci.competitors.map(c => <Badge key={c} v="info">{c}</Badge>)}</div></>}
                          {ci.techStack?.length > 0 && <><p style={{ margin: "8px 0 4px", fontWeight: 500, fontSize: 12 }}>Outils & methodes :</p><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{ci.techStack.map(t => <Badge key={t} v="tech">{t}</Badge>)}</div></>}
                        </div>
                      );
                    })()}
                  </div>
                )}
                <p style={{ margin: "10px 0 0", fontSize: 12, color: T.light }}>Extrait depuis {jobData.source}</p>
              </div>
            )}
          </div>
          {jobData && !jobLoading && (
            <div style={card}>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Etapes de l'entretien</h3>
              {interviewSteps.length > 0 && !manualStepMode && <p style={{ margin: "0 0 12px", fontSize: 13, color: T.mint }}>Detectees depuis l'offre</p>}
              {interviewSteps.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: manualStepMode ? 16 : 0 }}>
                  {interviewSteps.map(s => (
                    <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: T.r, background: "#FAFAF6" }}>
                      <div style={{ width: 26, height: 26, borderRadius: T.r, background: T.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{s.step}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{s.label}</div>
                        <div style={{ fontSize: 12, color: T.muted }}>{s.interlocutor}{s.duration ? ` · ${s.duration}` : ""}{s.type ? ` · ${s.type}` : ""}</div>
                      </div>
                      {manualStepMode && <button onClick={() => setInterviewSteps(p => p.filter(x => x.step !== s.step).map((x, i) => ({ ...x, step: i + 1 })))} style={{ background: "none", border: "none", color: T.light, cursor: "pointer", fontSize: 16, fontFamily: "inherit" }}>x</button>}
                    </div>
                  ))}
                </div>
              )}
              {manualStepMode && (
                <div>
                  {interviewSteps.length === 0 && <p style={{ margin: "0 0 12px", fontSize: 13, color: T.muted }}>Pas detectees — ajoute-les pour adapter le plan.</p>}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div style={{ flex: "1 1 140px" }}><label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 3 }}>Etape</label><input style={inp} placeholder="Entretien technique, RH, cas pratique..." value={newStepLabel} onChange={e => setNewStepLabel(e.target.value)} /></div>
                    <div style={{ flex: "1 1 140px" }}><label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 3 }}>Interlocuteur</label><input style={inp} placeholder="Lead Engineer" value={newStepPerson} onChange={e => setNewStepPerson(e.target.value)} /></div>
                    <div style={{ flex: "0 0 100px" }}><label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 3 }}>Format</label><select style={{ ...inp, cursor: "pointer" }} value={newStepType} onChange={e => setNewStepType(e.target.value)}><option value="visio">Visio</option><option value="sur site">Sur site</option><option value="tel">Telephone</option></select></div>
                    <button style={newStepLabel.trim() ? { ...btnP, padding: "10px 14px" } : { ...btnD, padding: "10px 14px" }} onClick={handleAddManualStep}>Ajouter</button>
                  </div>
                </div>
              )}
              {!manualStepMode && interviewSteps.length > 0 && <button style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 12, fontFamily: "inherit", textDecoration: "underline", padding: 0, marginTop: 10 }} onClick={() => setManualStepMode(true)}>Modifier</button>}
            </div>
          )}
        </>
      )}

      {activeTab === "profile" && (
        <div style={card}>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Ton CV</h3>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: T.muted }}>Upload ou colle le texte. Tous les formats acceptes.</p>
          <div style={{ border: `2px dashed ${cvFile ? T.mintBd : T.border}`, borderRadius: T.r, padding: "28px 16px", textAlign: "center", marginBottom: 12, cursor: "pointer", background: cvFile ? T.mintBg : "#FAFAF6" }} onClick={() => document.getElementById("cv-upload").click()}>
            <input id="cv-upload" type="file" accept=".pdf,.docx,.doc,.txt,.rtf,.odt,.png,.jpg" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) { setCvFile(e.target.files[0]); setCvText(""); setProfile(null); } }} />
            {cvFile ? <div><p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{cvFile.name}</p><p style={{ margin: "2px 0 0", fontSize: 12, color: T.muted }}>{(cvFile.size / 1024).toFixed(0)} Ko — Cliquer pour changer</p></div>
              : <div><p style={{ margin: 0, fontSize: 14, color: T.muted }}>Glisser-deposer ou <span style={{ color: T.text, fontWeight: 500, textDecoration: "underline" }}>parcourir</span></p><p style={{ margin: "4px 0 0", fontSize: 12, color: T.light }}>PDF, DOCX, TXT, RTF, ODT, PNG, JPG</p></div>}
          </div>
          <div style={{ textAlign: "center", fontSize: 12, color: T.light, margin: "8px 0" }}>ou</div>
          <textarea style={{ ...inp, minHeight: 100, resize: "vertical" }} placeholder="Colle ton CV texte ici..." value={cvText} onChange={e => { setCvText(e.target.value); setCvFile(null); setProfile(null); }} />
          <div style={{ marginTop: 20 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Profil LinkedIn <span style={{ fontSize: 12, color: T.light, fontWeight: 400 }}>(optionnel)</span></h3>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: T.muted }}>Pour affiner l'analyse avec tes competences et recommandations</p>
            <input style={inp} placeholder="https://linkedin.com/in/ton-profil" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
          </div>
          <div style={{ marginTop: 20 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Petits plus <span style={{ fontSize: 12, color: T.light, fontWeight: 400 }}>(optionnel)</span></h3>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: T.muted }}>Competences a creuser, points a renforcer...</p>
            <textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} placeholder="Ex: Je veux approfondir la modelisation financiere, le droit social, le system design..." value={extras} onChange={e => setExtras(e.target.value)} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <button style={btnS} onClick={() => { setView("dashboard"); resetFlow(); }}>Mes plans</button>
        <button style={isInputComplete ? btnP : btnD} onClick={handleAnalyze} disabled={!isInputComplete}>Analyser la compatibilite</button>
      </div>
    </>
  );

  // ─── STEP 2 ───
  const step2 = () => (
    <>
      {analysisLoading ? <Spin text="Analyse du poste et de ton profil..." /> : (
        <>
          <ErrorBanner msg={error} />
          <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{jobData?.title}</h3><p style={{ margin: "2px 0 0", fontSize: 13, color: T.muted }}>{jobData?.company} · {jobData?.location}</p></div>
            <button style={btnS} onClick={() => { setStep("input"); setMatches([]); }}>Modifier</button>
          </div>

          {interviewSteps.length > 0 && (
            <div style={card}>
              <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 600 }}>Processus d'entretien</h3>
              <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>
                {interviewSteps.map((s, i) => (
                  <div key={s.step} style={{ display: "flex", alignItems: "center" }}>
                    <div onClick={() => setFocusedStep(focusedStep === s.step ? null : s.step)} style={{ padding: "8px 14px", border: `1px solid ${focusedStep === s.step ? T.accent : T.border}`, borderRadius: T.r, background: focusedStep === s.step ? T.accentLt : T.card, cursor: "pointer", textAlign: "center", minWidth: 100 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{s.label}</div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{s.interlocutor}</div>
                      <div style={{ fontSize: 11, color: T.light }}>{s.type}{s.duration ? ` · ${s.duration}` : ""}</div>
                    </div>
                    {i < interviewSteps.length - 1 && <div style={{ width: 20, height: 1, background: T.border }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={card}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Correspondances avec le poste</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: T.muted }}>Selectionne les sujets prioritaires</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {matches.map(m => {
                const sel = selectedPriorities.includes(m.reqId);
                return (
                  <div key={m.reqId} onClick={() => togglePriority(m.reqId)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: `${sel ? 2 : 1}px solid ${sel ? T.accent : T.border}`, borderRadius: T.r, cursor: "pointer", background: sel ? T.accentLt : T.card, transition: "all .15s" }}>
                    <div style={{ width: 18, height: 18, borderRadius: T.r, border: sel ? "none" : `2px solid ${T.border}`, background: sel ? T.accent : T.card, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{sel && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>OK</span>}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 500 }}>{m.label}</span><Badge v={m.match}>{m.match === "strong" ? "Fort" : m.match === "partial" ? "Partiel" : "A travailler"}</Badge></div>
                      <p style={{ margin: "3px 0 0", fontSize: 12, color: T.muted }}>{m.profileEvidence}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {(companyInfo || jobData?.companyInfo) && (
            <div style={card}>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Veille : {jobData?.company}</h3>
              {(() => { const ci = companyInfo || jobData.companyInfo; return (
                <div style={{ fontSize: 13 }}>
                  {ci.recentNews?.length > 0 && <div style={{ marginBottom: 10 }}><span style={{ fontWeight: 500, fontSize: 12 }}>Actualites :</span>{ci.recentNews.map((n, i) => <p key={i} style={{ margin: "3px 0", paddingLeft: 8, fontSize: 13 }}>— {n}</p>)}</div>}
                  {ci.competitors?.length > 0 && <div style={{ marginBottom: 10 }}><span style={{ fontWeight: 500, fontSize: 12 }}>Concurrents :</span><div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>{ci.competitors.map(c => <Badge key={c} v="info">{c}</Badge>)}</div></div>}
                  {ci.techStack?.length > 0 && <div><span style={{ fontWeight: 500, fontSize: 12 }}>Outils & methodes :</span><div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>{ci.techStack.map(t => <Badge key={t} v="tech">{t}</Badge>)}</div></div>}
                </div>
              ); })()}
            </div>
          )}

          <div style={card}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Prochain entretien</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: "0 0 auto" }}><label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 3 }}>Date</label><input type="date" style={{ ...inp, width: 180 }} value={interviewDate} onChange={e => setInterviewDate(e.target.value)} min={today()} /></div>
              <div style={{ flex: "1 1 200px" }}><label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 3 }}>Interlocuteur</label><input style={inp} placeholder="Senior Engineer, EM..." value={nextInterlocutor} onChange={e => setNextInterlocutor(e.target.value)} /></div>
            </div>
            {interviewDate && <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13, color: T.muted }}>{daysUntil} jours de preparation{nextInterlocutor ? ` — avec ${nextInterlocutor}` : ""}</p>}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <button style={btnS} onClick={goBack}>Retour</button>
            <button style={(selectedPriorities.length > 0 && interviewDate) ? btnP : btnD} onClick={handleGeneratePlan} disabled={selectedPriorities.length === 0 || !interviewDate || planLoading}>{planLoading ? "Generation du plan..." : `Generer mon plan (${selectedPriorities.length} sujets)`}</button>
          </div>
        </>
      )}
    </>
  );

  // ─── STEP 3 ───
  const step3 = () => (
    <>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <div><h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Plan de preparation</h3><p style={{ margin: "2px 0 0", fontSize: 13, color: T.muted }}>{jobData?.title} chez {jobData?.company}{nextInterlocutor ? ` — prochain : ${nextInterlocutor}` : ""}</p></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={btnS} onClick={() => { setView("dashboard"); resetFlow(); }}>Mes plans</button>
            <button style={btnS} onClick={goBack}>Modifier l'analyse</button>
            <button style={notificationsEnabled ? { ...btnS, background: T.mintBg, borderColor: T.mintBd } : btnP} onClick={() => { if ("Notification" in window) Notification.requestPermission(); setNotificationsEnabled(true); }}>{notificationsEnabled ? "Rappels actifs" : "Activer rappels"}</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: 16, borderRadius: T.r, background: T.accentLt, border: `1px solid ${T.accentBd}` }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 700, color: T.accent }}>{completedCount}/{prepPlan.length}</div><div style={{ fontSize: 12, color: T.muted }}>sessions</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 700, color: T.accent }}>{prepPlan.length > 0 ? Math.round((completedCount / prepPlan.length) * 100) : 0}%</div><div style={{ fontSize: 12, color: T.muted }}>realise</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 700, color: daysUntil <= 2 ? T.coral : T.accent }}>{daysUntil}j</div><div style={{ fontSize: 12, color: T.muted }}>restants</div></div>
        </div>
        <div style={{ marginTop: 10 }}><Bar value={completedCount} max={prepPlan.length} color={T.accent} h={8} /></div>
      </div>

      {/* Culture & Company Panel */}
      <CulturePanel companyInfo={companyInfo} jobData={jobData} />

      {/* Day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 6, marginBottom: 16 }}>
        {prepPlan.map((day, idx) => {
          const dt = getPlanDate(idx); const isT = dt === today(); const locked = day.day > 1 && !completedDays[day.day - 1]; const done = !!completedDays[day.day];
          return (
            <div key={day.day} onClick={() => !locked && setExpandedDay(expandedDay === day.day ? null : day.day)}
              style={{ padding: "10px 8px", borderRadius: T.r, border: `${expandedDay === day.day ? 2 : 1}px solid ${done ? T.mintBd : locked ? T.locked : expandedDay === day.day ? T.accent : isT ? T.accentBd : T.border}`, background: done ? T.mintBg : locked ? T.locked : expandedDay === day.day ? T.accentLt : isT ? T.accentLt : T.card, cursor: locked ? "not-allowed" : "pointer", textAlign: "center", opacity: locked ? 0.5 : 1, transition: "all .15s" }}>
              <div style={{ fontSize: 11, marginBottom: 2, fontWeight: isT ? 600 : 400, color: done ? T.mint : locked ? T.lockedTxt : isT ? T.accent : T.light }}>{done ? "OK" : isT ? "Auj." : locked ? "---" : formatDateFr(dt)}</div>
              <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3, color: locked ? T.lockedTxt : T.text }}>{day.focus}</div>
            </div>
          );
        })}
      </div>

      {/* Day details */}
      {prepPlan.map((day, idx) => {
        const dt = getPlanDate(idx); const isT = dt === today(); const locked = day.day > 1 && !completedDays[day.day - 1]; const done = !!completedDays[day.day];
        if (locked && expandedDay !== day.day) return null;
        return (
          <div key={day.day} style={{ ...card, display: expandedDay === null || expandedDay === day.day ? "block" : "none", borderColor: done ? T.mintBd : locked ? T.locked : isT ? T.accentBd : T.border, opacity: locked ? 0.5 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: locked ? "not-allowed" : "pointer" }} onClick={() => !locked && setExpandedDay(expandedDay === day.day ? null : day.day)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ minWidth: 52, padding: "6px 8px", borderRadius: T.r, background: done ? T.mint : locked ? T.locked : T.accent, color: done ? "#fff" : locked ? T.lockedTxt : "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 11, lineHeight: 1 }}>{done ? "OK" : formatDateFr(dt).split(" ")[0]}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{new Date(dt).getDate()}</div>
                </div>
                <div><h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: locked ? T.lockedTxt : T.text }}>{day.title}</h4><p style={{ margin: 0, fontSize: 12, color: locked ? T.lockedTxt : T.muted }}>{day.focus}</p></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {!locked && <button onClick={e => { e.stopPropagation(); toggleDayComplete(day.day); }} style={{ ...btnS, padding: "6px 12px", fontSize: 12, background: done ? T.mintBg : T.card, borderColor: done ? T.mintBd : T.border, color: done ? T.mint : T.text }}>{done ? "Fait" : "Marquer fait"}</button>}
                <span style={{ fontSize: 12, color: T.light }}>{day.items?.length} act.</span>
              </div>
            </div>
            {!locked && (expandedDay === null || expandedDay === day.day) && (
              <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {day.items?.map((it, i) => {
                  const isExpanded = expandedItems[`${day.day}-${i}`];
                  return (
                    <div key={i} style={{ borderRadius: T.r, background: done ? T.mintBg : it.type === "quiz" ? T.quizBg : "#FAFAF6", border: `1px solid ${done ? T.mintBd : it.type === "quiz" ? T.quizBd : "#EDE9E3"}`, opacity: done ? 0.7 : 1, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer" }} onClick={() => toggleItemExpand(day.day, i)}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, textDecoration: done ? "line-through" : "none", color: done ? T.muted : T.text }}>{it.title}</div>
                          <div style={{ fontSize: 12, color: T.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                            <Badge v={done ? "default" : typeV[it.type] || "default"}>{typeL[it.type] || it.type}</Badge>
                            <span>{it.duration}</span>
                          </div>
                        </div>
                        {!done && (
                          <button style={{ ...btnS, padding: "6px 12px", fontSize: 12, background: isExpanded ? T.accentLt : T.card, borderColor: isExpanded ? T.accentBd : T.border }}
                            onClick={e => { e.stopPropagation(); toggleItemExpand(day.day, i); }}>
                            {isExpanded ? "Fermer" : it.type === "exercise" ? "Commencer" : it.type === "video" ? "Regarder" : it.type === "quiz" ? "Lancer" : "Lire"}
                          </button>
                        )}
                      </div>
                      {isExpanded && !done && (
                        <div style={{ padding: "0 12px 12px" }}>
                          <div style={{ height: 1, background: "#EDE9E3", marginBottom: 8 }} />
                          <ItemContent item={it} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {notificationsEnabled && <div style={{ padding: "12px 16px", borderRadius: T.r, background: T.mintBg, border: `1px solid ${T.mintBd}`, fontSize: 13, color: T.mint }}>Rappel quotidien active</div>}
    </>
  );

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 740, margin: "0 auto", padding: "24px 16px", color: T.text, lineHeight: 1.55, background: T.bg, minHeight: "100vh" }}>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: T.accent, cursor: "pointer" }} onClick={() => { if (step === "plan") { setView("dashboard"); resetFlow(); } }}>EzInterview</span>
        <span style={{ fontSize: 11, color: T.light, background: T.accentLt, padding: "2px 8px", borderRadius: T.r, border: `1px solid ${T.accentBd}` }}>beta</span>
      </div>

      {view === "dashboard" ? (
        <PlansDashboard plans={savedPlans} onSelect={loadSavedPlan} onNew={() => { resetFlow(); setView("editor"); }} user={user} onLogout={handleLogout} />
      ) : (
        <>
          {step !== "plan" && <Steps />}
          {step === "input" && step1()}
          {step === "analysis" && step2()}
          {step === "plan" && step3()}
        </>
      )}
    </div>
  );
}
