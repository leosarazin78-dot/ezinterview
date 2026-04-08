"use client";
import { useState, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { signupSchema, profileSchema, jobUrlSchema, cvInputSchema, feedbackSchema, reportSchema, zodFirstError } from "./lib/validation";

// ─── Supabase browser client ───
const supabase = typeof window !== "undefined"
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null;

// ─── PREMIUM 2026 THEME ───
const T = {
  // Base
  bg: "#0A0A0F",
  bgSoft: "#12121A",
  bgCard: "#1A1A24",
  bgGlass: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.15)",

  // Text
  text: "#F0F0F5",
  muted: "#8888A0",
  light: "#555568",

  // Accent — warm indigo/violet gradient
  accent: "#7C5CFC",
  accentHover: "#9B7FFF",
  accentLt: "rgba(124,92,252,0.12)",
  accentBd: "rgba(124,92,252,0.25)",
  accentGradient: "linear-gradient(135deg, #7C5CFC 0%, #5B8DEF 100%)",

  // Semantic
  green: "#34D399",
  greenLt: "rgba(52,211,153,0.12)",
  greenBd: "rgba(52,211,153,0.25)",
  warn: "#FBBF24",
  warnLt: "rgba(251,191,36,0.12)",
  warnBd: "rgba(251,191,36,0.25)",
  red: "#F87171",
  redLt: "rgba(248,113,113,0.12)",
  redBd: "rgba(248,113,113,0.25)",
  purple: "#A78BFA",
  purpleLt: "rgba(167,139,250,0.12)",
  purpleBd: "rgba(167,139,250,0.25)",
  orange: "#FB923C",
  orangeLt: "rgba(251,146,60,0.12)",
  orangeBd: "rgba(251,146,60,0.25)",
  pink: "#F472B6",
  pinkLt: "rgba(244,114,182,0.12)",
  pinkBd: "rgba(244,114,182,0.25)",

  r: 16,
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

// ─── Logo Component ───
const Logo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect width="40" height="40" rx="12" fill="url(#logoGrad)"/>
    <path d="M10 12h10v3H13.5v4.5h6v3h-6V27H10V12Z" fill="#fff" opacity="0.9"/>
    <path d="M21 12h9.5l-5 7.5L31 27h-4l-3.8-5.7L19.5 27H16l5.5-7.5L16.5 12H21Z" fill="#fff"/>
    <defs><linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40"><stop stopColor="#7C5CFC"/><stop offset="1" stopColor="#5B8DEF"/></linearGradient></defs>
  </svg>
);

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
  return <span style={{ ...s[v] || s.default, padding: "4px 12px", borderRadius: T.r, fontSize: 12, fontWeight: 500, display: "inline-block", lineHeight: "20px" }}>{children}</span>;
};

const Spin = ({ text }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", padding: 32 }}>
    <div style={{ width: 16, height: 16, border: `2px solid ${T.accentBd}`, borderTopColor: T.accent, borderRadius: "50%", animation: "spin .6s linear infinite" }} />
    <span style={{ fontSize: 14, color: T.muted }}>{text}</span>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const Bar = ({ value, max, color = T.accent, h = 6 }) => (
  <div style={{ height: h, borderRadius: T.r, background: T.bgCard, overflow: "hidden", width: "100%", border: `1px solid ${T.border}` }}>
    <div style={{ height: "100%", width: `${max > 0 ? Math.round((value / max) * 100) : 0}%`, borderRadius: T.r, background: color, transition: "width .4s ease" }} />
  </div>
);

// ─── Styles ───
const card = { background: T.bgGlass, border: `1px solid ${T.border}`, borderRadius: T.r, padding: 24, marginBottom: 16, backdropFilter: "blur(20px)" };
const inp = { width: "100%", padding: "12px 14px", border: `1px solid ${T.border}`, borderRadius: T.r, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: "rgba(255,255,255,0.05)", color: T.text, transition: "all 0.2s" };
const btnP = { background: T.accentGradient, color: "#fff", border: "none", borderRadius: T.r, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", boxShadow: "0 4px 16px rgba(124,92,252,0.25)" };
const btnS = { background: T.bgGlass, color: T.text, border: `1px solid ${T.border}`, borderRadius: T.r, padding: "12px 24px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", backdropFilter: "blur(10px)" };
const btnD = { ...btnP, background: "rgba(136,136,160,0.3)", cursor: "not-allowed", boxShadow: "none" };
const tabS = (a) => ({ padding: "10px 20px", border: "none", borderBottom: a ? `2px solid ${T.accent}` : "2px solid transparent", background: "transparent", color: a ? T.text : T.muted, fontWeight: a ? 600 : 400, fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" });
const typeL = { memo: "Memo", video: "Vidéo", exercise: "Labo", note: "Note", quiz: "Quiz" };
const typeV = { memo: "default", video: "info", exercise: "tech", note: "default", quiz: "warn" };

// ─── Quiz Component ───
function QuizBlock({ questions, title }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const score = submitted ? questions.filter((q, i) => answers[i] === q.correct).length : 0;

  return (
    <div style={{ marginTop: 12 }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{
        width: "100%", padding: "14px 18px", borderRadius: T.r,
        background: T.warnLt, border: `1px solid ${T.warnBd}`,
        color: T.warn, fontWeight: 700, fontSize: 14,
        cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.2s", marginBottom: isOpen ? 12 : 0
      }}>
        <span>📝 {title || "Quiz"} ({questions.length} questions)</span>
        <span style={{ fontSize: 12, color: T.muted }}>{isOpen ? "▼ Fermer" : "▶ Commencer le quiz"}</span>
      </button>
      {isOpen && (
        <div>
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
            <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: T.r, background: score >= questions.length * 0.7 ? T.greenLt : T.warnLt, border: `1px solid ${score >= questions.length * 0.7 ? T.greenBd : T.warnBd}` }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: score >= questions.length * 0.7 ? T.green : T.warn }}>{score}/{questions.length} — {score >= questions.length * 0.7 ? "Bien joué !" : "À revoir"}</span>
              <button style={{ ...btnS, marginLeft: 12, padding: "6px 14px", fontSize: 12 }} onClick={() => { setAnswers({}); setSubmitted(false); }}>Refaire</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MiniQuizAccordion ───
function MiniQuizAccordion({ questions }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  if (!questions?.length) return null;
  const q = questions[current];

  return (
    <div style={{ marginTop: 12 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", padding: "12px 16px", borderRadius: T.r,
        background: open ? T.warnLt : T.bgSoft,
        border: `1px solid ${open ? T.warnBd : T.border}`,
        color: T.warn, fontWeight: 700, fontSize: 13,
        cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.2s"
      }}>
        <span>🧠 Mini-Quiz ({questions.length} question{questions.length > 1 ? "s" : ""})</span>
        <span style={{ fontSize: 11, color: T.muted }}>{open ? "▼ Fermer" : "▶ Tester mes connaissances"}</span>
      </button>

      {open && (
        <div style={{ marginTop: 8, padding: 16, borderRadius: T.r, background: T.warnLt, border: `1px solid ${T.warnBd}`, animation: "fadeIn 0.2s ease" }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: T.muted }}>Question {current + 1}/{questions.length}</p>
          <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600, color: T.text }}>{q.q}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {q.options?.map((opt, oi) => (
              <button key={oi} onClick={() => {
                if (!showResult) {
                  setSelected(oi);
                  setShowResult(true);
                  if (oi === q.correct) setScore(s => s + 1);
                }
              }}
                style={{
                  padding: "10px 14px", borderRadius: T.r, fontSize: 13, textAlign: "left",
                  border: `1px solid ${showResult && oi === q.correct ? T.greenBd : showResult && selected === oi && oi !== q.correct ? T.redBd : T.warnBd}`,
                  background: showResult && oi === q.correct ? T.greenLt : showResult && selected === oi && oi !== q.correct ? T.redLt : T.bgCard,
                  cursor: showResult ? "default" : "pointer", fontFamily: "inherit", color: T.text,
                  transition: "all 0.15s", minHeight: 44
                }}>
                {opt}
              </button>
            ))}
          </div>
          {showResult && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
              {current < questions.length - 1 ? (
                <button style={{ ...btnP, padding: "8px 16px", fontSize: 12 }} onClick={() => { setCurrent(c => c + 1); setSelected(null); setShowResult(false); }}>Question suivante →</button>
              ) : (
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: score >= questions.length * 0.7 ? T.green : T.warn }}>Résultat : {score}/{questions.length} — {score >= questions.length * 0.7 ? "Bien joué !" : "À revoir"}</p>
              )}
            </div>
          )}
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
    <div style={{ marginTop: 10, padding: 12, borderRadius: T.r, background: T.warnLt, border: `1px solid ${T.warnBd}` }}>
      <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: T.warn }}>Mini-Quiz</p>
      <p style={{ margin: "0 0 6px", fontSize: 13 }}>{q.q}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {q.options?.map((opt, oi) => (
          <button key={oi} onClick={() => { if (!showResult) { setSelected(oi); setShowResult(true); } }}
            style={{ padding: "4px 10px", borderRadius: T.r, fontSize: 12, border: `1px solid ${showResult && oi === q.correct ? T.greenBd : showResult && selected === oi ? T.redBd : T.warnBd}`, background: showResult && oi === q.correct ? T.greenLt : showResult && selected === oi && oi !== q.correct ? T.redLt : T.bgCard, cursor: showResult ? "default" : "pointer", fontFamily: "inherit", color: T.text }}>
            {opt}
          </button>
        ))}
      </div>
      {showResult && current < questions.length - 1 && (
        <button style={{ ...btnS, padding: "4px 12px", fontSize: 11, marginTop: 6 }} onClick={() => { setCurrent(c => c + 1); setSelected(null); setShowResult(false); }}>Suivant</button>
      )}
    </div>
  );
}

// ─── Item Expanded Content ───
function ItemContent({ item }) {
  const c = item.content;
  if (!c) return <p style={{ fontSize: 13, color: T.muted, margin: "8px 0 0" }}>Pas de contenu détaillé.</p>;

  return (
    <div style={{ marginTop: 14 }}>
      {(item.type === "note" || item.type === "memo") && (
        <>
          {c.summary && <p style={{ margin: "0 0 14px", fontSize: 14, lineHeight: 1.7, color: T.text, letterSpacing: "0.01em" }}>{c.summary}</p>}

          {/* Sub-sections with headings */}
          {c.sections?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
              {c.sections.map((sec, si) => (
                <div key={si} style={{ padding: "12px 16px", borderRadius: T.r, background: T.bgSoft, borderLeft: `3px solid ${T.accent}` }}>
                  <h6 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "0.5px" }}>{sec.heading}</h6>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {sec.points?.map((pt, pi) => (
                      <p key={pi} style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: T.text, paddingLeft: 12, borderLeft: `2px solid ${T.border}` }}>{pt}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {c.keyPoints?.length > 0 && (
            <div style={{ marginBottom: 12, padding: "12px 16px", borderRadius: T.r, background: T.accentLt, border: `1px solid ${T.accentBd}` }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: T.accent, textTransform: "uppercase", letterSpacing: "1px" }}>Points clés</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {c.keyPoints.map((pt, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: T.accent, fontSize: 10, marginTop: 4, flexShrink: 0 }}>◆</span>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: T.text }}>{pt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {c.tips?.length > 0 && (
            <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: T.r, background: T.warnLt, border: `1px solid ${T.warnBd}` }}>
              <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: T.warn, textTransform: "uppercase", letterSpacing: "1px" }}>Astuces</p>
              {c.tips.map((tip, i) => <p key={i} style={{ margin: "0 0 3px", fontSize: 12, lineHeight: 1.5, color: T.text }}>💡 {tip}</p>)}
            </div>
          )}
          {c.links?.length > 0 && <LinksBlock links={c.links} />}
          {item.miniQuiz?.length > 0 && <MiniQuizAccordion questions={item.miniQuiz} />}
        </>
      )}

      {item.type === "exercise" && (
        <>
          {c.objective && <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500, color: T.text, lineHeight: 1.6 }}>{c.objective}</p>}
          {c.steps?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {c.steps.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "8px 12px", borderRadius: T.r, background: i % 2 === 0 ? T.purpleLt : "transparent", border: i % 2 === 0 ? `1px solid ${T.purpleBd}` : "1px solid transparent" }}>
                  <span style={{ color: T.purple, fontWeight: 800, fontSize: 14, flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: T.purpleLt, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.purpleBd}` }}>{i + 1}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.6, color: T.text }}>{s}</span>
                </div>
              ))}
            </div>
          )}
          {c.tips?.length > 0 && (
            <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: T.r, background: T.purpleLt, border: `1px solid ${T.purpleBd}` }}>
              {c.tips.map((tip, i) => <p key={i} style={{ margin: "0 0 3px", fontSize: 12, lineHeight: 1.5, color: T.text }}>💡 {tip}</p>)}
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
          style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: T.r, fontSize: 12, textDecoration: "none", color: lk.type === "video" ? T.orange : lk.type === "lab" ? T.purple : T.accent, background: lk.type === "video" ? T.orangeLt : lk.type === "lab" ? T.purpleLt : T.accentLt, border: `1px solid ${lk.type === "video" ? T.orangeBd : lk.type === "lab" ? T.purpleBd : T.accentBd}`, transition: "all 0.2s" }}>
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

  const company = jobData?.company || "l'entreprise";
  let companyDomain = null;
  if (jobData?.job_url) {
    try { companyDomain = new URL(jobData.job_url).hostname.replace("www.", ""); } catch {}
  }
  const companySlug = company.toLowerCase().replace(/[^a-z0-9]/g, "");

  return (
    <div style={{ ...card, background: T.accentLt, borderColor: T.accentBd }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: T.accentGradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🏢</div>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.accent }}>Culture & Veille — {company}</h3>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: T.muted }}>Secteur : {ci.sector || "non précisé"}</p>
        </div>
      </div>

      {/* Importance notice */}
      <div style={{ padding: 12, borderRadius: T.r, background: T.warnLt, border: `1px solid ${T.warnBd}`, marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.warn }}>Pourquoi c'est important ?</p>
        <p style={{ margin: "4px 0 0", fontSize: 12, lineHeight: 1.6, color: T.text }}>
          Même pour un entretien technique, montrer que tu connais la culture, les valeurs et l'actualité de l'entreprise fait la différence.
          Les recruteurs veulent savoir si tu t'es renseigné et si tu partages leur vision. C'est souvent ce qui départage deux candidats de niveau égal.
        </p>
      </div>

      {ci.founded && <p style={{ margin: "0 0 10px", fontSize: 13, color: T.muted }}>Fondée en {ci.founded} · {ci.hq} · {ci.employees} employés · {ci.sector}</p>}

      {ci.businessModel && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>Business model</p>
          <p style={{ margin: 0, fontSize: 13 }}>{ci.businessModel}</p>
        </div>
      )}

      {ci.culture && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: T.r, background: T.bgCard, border: `1px solid ${T.border}` }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: T.accent }}>Culture d'entreprise</p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{ci.culture}</p>
        </div>
      )}

      {ci.recentNews?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>Actualités</p>
          {ci.recentNews.map((n, i) => <p key={i} style={{ margin: "0 0 3px", fontSize: 12, paddingLeft: 8 }}>— {n}</p>)}
        </div>
      )}

      {ci.competitors?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>Concurrents</p>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{ci.competitors.map(c => <Badge key={c} v="info">{c}</Badge>)}</div>
        </div>
      )}

      {ci.techStack?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>Outils & méthodes</p>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{ci.techStack.map(t => <Badge key={t} v="tech">{t}</Badge>)}</div>
        </div>
      )}

      {/* Company links */}
      <div style={{ marginTop: 8, padding: 12, borderRadius: T.r, background: T.bgCard, border: `1px solid ${T.border}` }}>
        <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: T.accent }}>Liens utiles — à consulter avant l'entretien</p>
        <div className="ez-culture-links" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <a href={`https://www.google.com/search?q=${encodeURIComponent(company + " site officiel")}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: T.r, fontSize: 12, textDecoration: "none", color: T.accent, background: T.accentLt, border: `1px solid ${T.accentBd}`, fontWeight: 500, transition: "all 0.2s" }}>
            🌐 Site officiel
          </a>
          <a href={`https://www.google.com/search?q=${encodeURIComponent(company + " avis salariés glassdoor")}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: T.r, fontSize: 12, textDecoration: "none", color: T.green, background: T.greenLt, border: `1px solid ${T.greenBd}`, fontWeight: 500, transition: "all 0.2s" }}>
            ⭐ Avis Glassdoor
          </a>
          <a href={`https://www.google.com/search?q=${encodeURIComponent(company + " actualités")}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: T.r, fontSize: 12, textDecoration: "none", color: T.warn, background: T.warnLt, border: `1px solid ${T.warnBd}`, fontWeight: 500, transition: "all 0.2s" }}>
            📰 Actualités
          </a>
          <a href={`https://www.linkedin.com/company/${companySlug}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: T.r, fontSize: 12, textDecoration: "none", color: T.accent, background: T.accentLt, border: `1px solid ${T.accentBd}`, fontWeight: 500, transition: "all 0.2s" }}>
            💼 Page LinkedIn
          </a>
          <a href={`https://www.google.com/search?q=${encodeURIComponent(company + " carrières recrutement")}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: T.r, fontSize: 12, textDecoration: "none", color: T.purple, background: T.purpleLt, border: `1px solid ${T.purpleBd}`, fontWeight: 500, transition: "all 0.2s" }}>
            🎯 Page Carrières
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Landing Page ───
function LandingPage({ user, onLogin }) {
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState("login");
  const [signupStep, setSignupStep] = useState(1); // 1=email+mdp, 2=profil
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupProfile, setSignupProfile] = useState({ firstName: "", lastName: "", phone: "", city: "", birthYear: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [demoDay, setDemoDay] = useState(null);

  const passwordStrength = (pw) => {
    if (!pw) return { score: 0, label: "", color: T.muted };
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 1) return { score: s, label: "Très faible", color: T.red };
    if (s === 2) return { score: s, label: "Faible", color: T.red };
    if (s === 3) return { score: s, label: "Moyen", color: T.warn };
    if (s === 4) return { score: s, label: "Fort", color: T.green };
    return { score: s, label: "Très fort", color: T.green };
  };

  const pwStr = passwordStrength(password);
  const isPasswordValid = password.length >= 8 && pwStr.score >= 3;

  const handleEmail = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onLogin?.();
      } else {
        if (signupStep === 1) {
          try { signupSchema.parse({ email, password }); } catch (err) { setError(zodFirstError(err)); setLoading(false); return; }
          setSignupStep(2); setLoading(false); return;
        }
        try { profileSchema.parse(signupProfile); } catch (err) { setError(zodFirstError(err)); setLoading(false); return; }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { ...signupProfile, profileComplete: true } }
        });
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

  const mockupDays = [
    { day: 1, title: "Fondamentaux React & Hooks", status: "completed", items: [
      { t: "Les Hooks essentiels", type: "Note", done: true },
      { t: "Exercice : mini-app useState", type: "Labo", done: true },
      { t: "Quiz — Hooks & cycle de vie", type: "Quiz", done: true, score: "4/5" },
    ]},
    { day: 2, title: "State Management avancé", status: "completed", items: [
      { t: "useReducer vs useState", type: "Note", done: true },
      { t: "Context API en pratique", type: "Note", done: true },
      { t: "Quiz — Gestion d'état", type: "Quiz", done: true, score: "5/5" },
    ]},
    { day: 3, title: "Tests & Qualité de code", status: "progress", items: [
      { t: "Testing Library & Jest", type: "Note", done: true },
      { t: "Exercice : tester un composant", type: "Labo", done: false },
      { t: "Quiz — Bonnes pratiques", type: "Quiz", done: false },
    ]},
    { day: 4, title: "Architecture & Patterns", status: "locked", items: [
      { t: "Atomic Design & structure projet", type: "Note", done: false },
      { t: "Performance & React.memo", type: "Note", done: false },
    ]},
    { day: 5, title: "Culture d'entreprise & Entretien", status: "locked", items: [
      { t: "Recherche sur l'entreprise", type: "Note", done: false },
      { t: "Simulation d'entretien", type: "Labo", done: false },
    ]},
  ];

  const features = [
    { icon: "📚", title: "Sources fiables, vraiment", desc: "Légifrance, MDN, PubMed, Investopedia, Coursera, docs officielles." },
    { icon: "🎯", title: "Fini le hors-sujet", desc: "Chaque ressource est adaptée à l'offre que TU as fournie." },
    { icon: "🧠", title: "Ton copilote, pas ton remplaçant", desc: "Des quiz, des exercices, des rappels — tu travailles vraiment." },
    { icon: "📈", title: "Progression en temps réel", desc: "Vois exactement où tu en es. Aucune surprise le jour J." },
  ];

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: T.text, background: T.bg, minHeight: "100vh", lineHeight: 1.6 }}>
      {/* JSON-LD Structured Data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "EZE",
        "description": "Préparation d'entretien personnalisée avec IA : analyse de poste, matching CV, plan jour par jour.",
        "url": "https://eze-interview.vercel.app",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "120" },
        "inLanguage": "fr"
      })}} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { background: #0A0A0F; margin: 0; }
        ::selection { background: rgba(124,92,252,0.3); color: #fff; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(124,92,252,0.2); } 50% { box-shadow: 0 0 40px rgba(124,92,252,0.4); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        .glass:hover { border-color: rgba(255,255,255,0.15); }
        .btn-primary { background: linear-gradient(135deg, #7C5CFC, #5B8DEF); color: #fff; border: none; border-radius: 16px; padding: 12px 24px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(124,92,252,0.4); }
        .ez-card { transition: all 0.2s ease; cursor: pointer; }
        .ez-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(124,92,252,0.15); border-color: rgba(124,92,252,0.4); }
        .ez-btn { transition: all 0.15s ease; }
        .ez-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(124,92,252,0.35); }
        @media (max-width: 768px) {
          .ez-hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; padding: 48px 20px !important; }
          .ez-hero-text h1 { font-size: 32px !important; letter-spacing: -1px !important; }
          .ez-hero-text p { font-size: 14px !important; margin-bottom: 28px !important; }
          .ez-hero-mockup { display: none !important; }
          .ez-courses-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .ez-features-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .ez-section { padding-left: 16px !important; padding-right: 16px !important; }
          .ez-section h2 { font-size: 24px !important; }
          .ez-nav-inner { padding: 0 16px !important; height: 56px !important; }
          .ez-nav-inner .ez-btn { padding: 8px 16px !important; font-size: 13px !important; }
          .ez-cta-box { padding: 32px 20px !important; border-radius: 16px !important; }
          .ez-cta-box h2 { font-size: 22px !important; }
          .ez-cta-box p { font-size: 14px !important; }
          .ez-cta-box button { padding: 14px 28px !important; font-size: 15px !important; width: 100% !important; }
          .ez-steps-section { padding: 48px 16px !important; }
          .ez-features-section { padding: 48px 16px !important; }
        }
        @media (max-width: 480px) {
          .ez-hero-text h1 { font-size: 26px !important; line-height: 1.15 !important; }
          .ez-hero-text p { font-size: 13px !important; }
          .ez-hero-grid { padding: 32px 16px !important; }
          .ez-nav-inner button:first-of-type { display: none !important; }
        }
      `}</style>

      {/* ─── Nav ─── */}
      <nav style={{ background: T.bgGlass, borderBottom: `1px solid ${T.border}`, backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="ez-nav-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <Logo size={32} />
            <span style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>EZE</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {user ? (
              <button onClick={() => onLogin?.()} style={{ background: "transparent", border: "none", color: T.muted, fontSize: 14, fontWeight: 500, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", borderRadius: 8, transition: "all 0.2s" }}>Mon espace</button>
            ) : (
              <>
                <button onClick={() => setShowAuth(true)} style={{ background: "transparent", border: "none", color: T.muted, fontSize: 14, fontWeight: 500, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit", borderRadius: 8, transition: "all 0.2s" }}>Se connecter</button>
                <button className="ez-btn" onClick={() => setShowAuth(true)} style={{ background: T.accentGradient, color: "#fff", border: "none", borderRadius: 10, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(124,92,252,0.25)" }}>S'inscrire</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{ background: T.bg, borderBottom: `1px solid ${T.border}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,92,252,0.15) 0%, transparent 70%)", top: -200, right: -100, pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(91,141,239,0.1) 0%, transparent 70%)", bottom: -100, left: 100, pointerEvents: "none" }} />

        <div className="ez-hero-grid ez-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", position: "relative", zIndex: 1 }}>
          <div className="ez-hero-text" style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={{ display: "inline-block", padding: "8px 16px", borderRadius: 20, background: T.accentLt, fontSize: 12, fontWeight: 700, color: T.accent, marginBottom: 32, border: `1px solid ${T.accentBd}` }}>Nouveau : tous les métiers</div>
            <h1 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.1, margin: "0 0 24px", letterSpacing: "-1.5px", color: T.text, background: T.accentGradient, backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Arrive en entretien avec l'assurance de celui qui a déjà les réponses.
            </h1>
            <p style={{ fontSize: 18, color: T.muted, margin: "0 0 40px", lineHeight: 1.8, maxWidth: 550 }}>
              La plupart des candidats ne savent pas par où commencer. EntretienZen crée un plan de préparation personnalisé, jour par jour, avec sources fiables et quiz adaptés à ton secteur.
            </p>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 48 }}>
              <button className="ez-btn" onClick={() => user ? onLogin?.() : setShowAuth(true)} style={{ ...btnP, padding: "14px 32px", fontSize: 16, fontWeight: 700 }}>
                {user ? "Accéder à mon espace" : "Préparer mon entretien gratuitement"}
              </button>
              <span style={{ fontSize: 13, color: T.muted }}>Sans carte bancaire</span>
            </div>
          </div>

          <div className="ez-hero-mockup" style={{ animation: "fadeIn 0.7s ease" }}>
            <div style={{ background: T.bgGlass, borderRadius: 24, padding: 24, border: `1px solid ${T.border}`, boxShadow: "0 20px 60px rgba(124,92,252,0.2)", backdropFilter: "blur(20px)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: T.accentGradient, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20 }}>📋</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Développeur Frontend React</div>
                  <div style={{ fontSize: 11, color: T.muted }}>Exemple interactif — clique pour explorer</div>
                </div>
              </div>
              {mockupDays.map((d, i) => (
                <div key={i} style={{ marginBottom: 6 }}>
                  <div
                    onClick={() => setDemoDay(demoDay === i ? null : i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                      borderRadius: demoDay === i ? `${T.r}px ${T.r}px 0 0` : T.r,
                      background: T.bgCard, cursor: "pointer",
                      border: `1px solid ${d.status === "completed" ? T.greenBd : d.status === "progress" ? T.accentBd : T.border}`,
                      borderBottom: demoDay === i ? "none" : undefined,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: d.status === "completed" ? T.greenLt : d.status === "progress" ? T.accentLt : "rgba(255,255,255,0.05)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                      color: d.status === "completed" ? T.green : d.status === "progress" ? T.accent : T.muted,
                    }}>
                      {d.status === "completed" ? "✓" : d.status === "progress" ? "▶" : `J${d.day}`}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: d.status === "locked" ? T.muted : T.text }}>Jour {d.day} — {d.title}</div>
                    </div>
                    <span style={{ fontSize: 11, color: T.muted }}>{demoDay === i ? "▼" : "▶"}</span>
                  </div>
                  {demoDay === i && (
                    <div style={{
                      padding: "8px 12px", background: d.status === "completed" ? T.greenLt : d.status === "progress" ? T.accentLt : T.bg,
                      border: `1px solid ${d.status === "completed" ? T.greenBd : d.status === "progress" ? T.accentBd : T.border}`,
                      borderTop: "none", borderRadius: `0 0 ${T.r}px ${T.r}px`,
                      animation: "fadeIn 0.2s ease",
                    }}>
                      {d.items.map((it, j) => (
                        <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: j < d.items.length - 1 ? `1px solid ${T.border}` : "none" }}>
                          <span style={{ fontSize: 13, width: 18, textAlign: "center" }}>{it.done ? "✅" : "⬜"}</span>
                          <span style={{ fontSize: 11, fontWeight: 500, color: it.done ? T.text : T.muted, flex: 1 }}>{it.t}</span>
                          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 6, background: it.type === "Quiz" ? T.warnLt : it.type === "Labo" ? T.purpleLt : T.accentLt, color: it.type === "Quiz" ? T.warn : it.type === "Labo" ? T.purple : T.accent, fontWeight: 600 }}>{it.type}</span>
                          {it.score && <span style={{ fontSize: 10, fontWeight: 700, color: T.green }}>{it.score}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: T.r, background: T.greenLt, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${T.greenBd}` }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.green }}>Progression globale</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: T.green }}>49%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section style={{ background: T.bg, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div className="ez-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ display: "inline-block", padding: "8px 16px", borderRadius: 20, background: T.orangeLt, fontSize: 12, fontWeight: 700, color: T.orange, marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px", border: `1px solid ${T.orangeBd}` }}>Comment ça marche</div>
            <h2 style={{ fontSize: 40, fontWeight: 900, margin: 0, color: T.text }}>3 étapes simples</h2>
          </div>
          <div className="ez-courses-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
            {[
              { title: "Analyse de l'offre", desc: "L'IA identifie les compétences clés, analyse l'entreprise et ses attentes.", icon: "🔗", n: 1 },
              { title: "Matching CV", desc: "Compare ton profil à l'offre. On identifie tes forces et tes points à travailler.", icon: "📄", n: 2 },
              { title: "Plan de préparation", desc: "Plan jour par jour : cours, exercices, quiz et ressources adaptées à ton métier.", icon: "🎯", n: 3 },
            ].map((c, i) => (
              <div key={i} className="ez-card" style={{ ...card, borderColor: T.accentBd }}>
                <div style={{ width: 56, height: 56, borderRadius: T.r, background: T.accentLt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 16 }}>{c.icon}</div>
                <div>
                  <div style={{ display: "inline-block", padding: "6px 12px", borderRadius: 20, background: T.accentLt, fontSize: 11, fontWeight: 700, color: T.accent, marginBottom: 8, textTransform: "uppercase", border: `1px solid ${T.accentBd}` }}>Étape {c.n}</div>
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
          <h2 style={{ fontSize: 40, fontWeight: 900, margin: "0 0 12px", color: T.text }}>Tout pour réussir ton entretien</h2>
          <p style={{ fontSize: 16, color: T.muted, margin: 0, maxWidth: 650, marginLeft: "auto", marginRight: "auto" }}>Des outils complets et une préparation sérieuse, pas des promesses creuses</p>
        </div>
        <div className="ez-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 28 }}>
          {features.map((h, i) => (
            <div key={i} style={{ ...card, borderColor: T.border }}>
              <div style={{ display: "flex", gap: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: T.r, background: T.accentLt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0, border: `1px solid ${T.accentBd}` }}>{h.icon}</div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px", color: T.text }}>{h.title}</h3>
                  <p style={{ fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6 }}>{h.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="ez-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 32px" }}>
        <div className="ez-cta-box" style={{ maxWidth: 700, margin: "0 auto", padding: "64px 48px", borderRadius: 24, background: T.accentGradient, color: "#fff", textAlign: "center", boxShadow: "0 20px 60px rgba(124,92,252,0.25)" }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, margin: "0 0 16px", letterSpacing: "-0.8px" }}>Prêt à décrocher ton poste ?</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.85)", margin: "0 0 32px", lineHeight: 1.7 }}>
            Commence ta préparation gratuitement. Sans carte bancaire, en 2 minutes.
          </p>
          <button className="ez-btn" onClick={() => user ? onLogin?.() : setShowAuth(true)} style={{ background: "#fff", color: T.accent, border: "none", borderRadius: T.r, padding: "16px 40px", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
            {user ? "Accéder à mon espace" : "Commencer maintenant"}
          </button>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ borderTop: `1px solid ${T.border}`, background: T.bgGlass, backdropFilter: "blur(20px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Logo size={28} />
            <span style={{ fontSize: 16, fontWeight: 700, color: T.text }}>EZE</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <a href="/mentions-legales" style={{ fontSize: 12, color: T.muted, textDecoration: "none", transition: "all 0.2s" }}>Mentions légales</a>
            <a href="/confidentialite" style={{ fontSize: 12, color: T.muted, textDecoration: "none", transition: "all 0.2s" }}>Confidentialité</a>
            <a href="/cgu" style={{ fontSize: 12, color: T.muted, textDecoration: "none", transition: "all 0.2s" }}>CGU</a>
            <span style={{ fontSize: 12, color: T.light }}>© 2024-2026</span>
          </div>
        </div>
      </footer>

      {/* ─── Auth Modal ─── */}
      {showAuth && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(10,10,15,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false); }}>
          <div style={{ maxWidth: 420, width: "100%", background: T.bgGlass, borderRadius: 20, padding: 32, position: "relative", boxShadow: "0 24px 64px rgba(124,92,252,0.2)", animation: "fadeIn 0.25s ease", border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}>
            <button onClick={() => setShowAuth(false)} style={{ position: "absolute", top: 16, right: 16, background: T.bgSoft, border: `1px solid ${T.border}`, fontSize: 16, color: T.muted, cursor: "pointer", fontFamily: "inherit", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}>✕</button>

            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: T.accentGradient, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 8px 24px rgba(124,92,252,0.3)" }}>
                <Logo size={28} />
              </div>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.text }}>Bienvenue</h3>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: T.muted }}>Connecte-toi pour préparer ton entretien</p>
            </div>

            <button onClick={handleGoogle} disabled={loading}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px 20px", marginBottom: 20, fontSize: 14, fontWeight: 600, background: T.bgCard, color: T.text, border: `1px solid ${T.border}`, borderRadius: T.r, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continuer avec Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 0 20px" }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontSize: 12, color: T.muted }}>ou par email</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            <div style={{ display: "flex", gap: 0, marginBottom: 20, background: T.bgCard, borderRadius: 12, padding: 3, border: `1px solid ${T.border}` }}>
              {["login", "signup"].map(m => (
                <button key={m} onClick={() => { setMode(m); setSignupStep(1); setError(""); setMessage(""); }}
                  style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 10, background: mode === m ? T.bgGlass : "transparent", color: mode === m ? T.text : T.muted, fontWeight: mode === m ? 600 : 400, fontSize: 13, cursor: "pointer", fontFamily: "inherit", boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.2)" : "none", transition: "all 0.2s" }}>
                  {m === "login" ? "Connexion" : "Inscription"}
                </button>
              ))}
            </div>

            <form onSubmit={handleEmail} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Login OR signup step 1 */}
              {(mode === "login" || signupStep === 1) && (
                <>
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inp} />
                  <input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} style={inp} />
                  {mode === "signup" && password && (
                    <div>
                      <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                        {[1,2,3,4,5].map(i => (
                          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= pwStr.score ? pwStr.color : T.bgCard, transition: "all 0.2s" }} />
                        ))}
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: pwStr.color, fontWeight: 500 }}>{pwStr.label}{pwStr.score < 3 ? " — min 8 car., 1 majuscule, 1 chiffre, 1 symbole" : ""}</p>
                    </div>
                  )}
                  <button type="submit" disabled={loading || !email || !password || !isValidEmail(email) || (mode === "signup" && !isPasswordValid)} style={{ ...(!isValidEmail(email) || !password || (mode === "signup" && !isPasswordValid) ? btnD : btnP) }}>
                    {loading ? "..." : mode === "login" ? "Connexion" : "Continuer →"}
                  </button>
                </>
              )}

              {/* Signup step 2 — profile info */}
              {mode === "signup" && signupStep === 2 && (
                <>
                  <div style={{ padding: "10px 14px", borderRadius: T.r, background: T.accentLt, border: `1px solid ${T.accentBd}`, marginBottom: 4 }}>
                    <p style={{ margin: 0, fontSize: 12, color: T.accent, fontWeight: 500 }}>✓ {email} — Dernière étape !</p>
                  </div>
                  <div className="ez-profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 3 }}>Prénom *</label>
                      <input type="text" placeholder="Jean" value={signupProfile.firstName} onChange={(e) => setSignupProfile(p => ({ ...p, firstName: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 3 }}>Nom *</label>
                      <input type="text" placeholder="Dupont" value={signupProfile.lastName} onChange={(e) => setSignupProfile(p => ({ ...p, lastName: e.target.value }))} style={inp} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 3 }}>Téléphone</label>
                    <input type="tel" placeholder="06 12 34 56 78" value={signupProfile.phone} onChange={(e) => setSignupProfile(p => ({ ...p, phone: e.target.value }))} style={inp} />
                  </div>
                  <div className="ez-profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 3 }}>Ville</label>
                      <input type="text" placeholder="Paris" value={signupProfile.city} onChange={(e) => setSignupProfile(p => ({ ...p, city: e.target.value }))} style={inp} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.muted, marginBottom: 3 }}>Année de naissance</label>
                      <input type="number" placeholder="1995" min="1950" max="2010" value={signupProfile.birthYear} onChange={(e) => setSignupProfile(p => ({ ...p, birthYear: e.target.value }))} style={inp} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => setSignupStep(1)} style={{ ...btnS, flex: "0 0 auto" }}>← Retour</button>
                    <button type="submit" disabled={loading || !signupProfile.firstName.trim() || !signupProfile.lastName.trim()} style={{ ...(!signupProfile.firstName.trim() || !signupProfile.lastName.trim() ? btnD : btnP), flex: 1 }}>
                      {loading ? "..." : "Créer mon compte"}
                    </button>
                  </div>
                </>
              )}
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
function PlansDashboard({ plans, onSelect, onNew, onDelete, deletingPlan, loadingPlan, user, onLogout }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <div style={card}>
      <div className="ez-dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text }}>Mes préparations</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: T.muted }}>Continue ou crée une nouvelle</p>
        </div>
        <button onClick={onNew} style={btnP}>Nouveau plan</button>
      </div>

      {!plans?.length ? (
        <p style={{ fontSize: 13, color: T.muted, textAlign: "center", padding: 32 }}>Aucun plan encore. Crée-en un pour commencer !</p>
      ) : (
        <div className="ez-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {plans.map((plan) => {
            const done = Object.keys(plan.completed_days || {}).length;
            const daysLeft = plan.interview_date ? Math.max(0, Math.ceil((new Date(plan.interview_date) - new Date()) / 86400000)) : null;
            return (
              <div key={plan.id} style={{ ...card, cursor: loadingPlan === plan.id ? "wait" : "pointer", position: "relative", opacity: loadingPlan === plan.id ? 0.7 : 1, transition: "opacity 0.2s" }}>
                <div onClick={() => !loadingPlan && onSelect(plan.id)}>
                  {loadingPlan === plan.id && (
                    <div style={{ position: "absolute", top: 16, right: 16, width: 16, height: 16, border: `2px solid ${T.accentBd}`, borderTopColor: T.accent, borderRadius: "50%", animation: "spin .6s linear infinite" }} />
                  )}
                  <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: T.text }}>{plan.job_title}</h3>
                  <p style={{ margin: "0 0 4px", fontSize: 12, color: T.muted }}>{plan.company}</p>
                  {plan.next_interlocutor && <p style={{ margin: "0 0 4px", fontSize: 11, color: T.accent }}>Face à : {plan.next_interlocutor}</p>}
                  {daysLeft !== null && <p style={{ fontSize: 11, color: T.warn, fontWeight: 600, margin: "0 0 8px" }}>J-{daysLeft}</p>}
                  <div style={{ fontSize: 11, color: T.muted }}>Jour {done + 1} / {plan.duration || 7}</div>
                </div>
                {confirmDelete === plan.id ? (
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(plan.id); setConfirmDelete(null); }}
                      disabled={deletingPlan === plan.id}
                      style={{ ...btnP, padding: "6px 12px", fontSize: 11, background: T.red }}>
                      {deletingPlan === plan.id ? "..." : "Confirmer"}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }}
                      style={{ ...btnS, padding: "6px 12px", fontSize: 11 }}>Annuler</button>
                  </div>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(plan.id); }}
                    style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: "none", cursor: "pointer", fontSize: 14, color: T.muted, padding: 4, transition: "all 0.2s" }}
                    title="Supprimer ce plan">🗑</button>
                )}
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
  const [jobText, setJobText] = useState("");
  const [showJobTextFallback, setShowJobTextFallback] = useState(false);
  const [jobData, setJobData] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState("");
  const [cvText, setCvText] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  const [interviewerRole, setInterviewerRole] = useState("");
  const [intensity, setIntensity] = useState("Standard");
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState(null);
  const [planError, setPlanError] = useState("");
  const [deletingPlan, setDeletingPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);

  const [expandedDay, setExpandedDay] = useState(0);
  const [expandedItems, setExpandedItems] = useState({});
  const [completedDays, setCompletedDays] = useState({});

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState("Retour général");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const [reportingItem, setReportingItem] = useState(null);
  const [reportText, setReportText] = useState("");

  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileData, setProfileData] = useState({ firstName: "", lastName: "", phone: "", city: "", birthYear: "" });

  // ─── Hash-based routing ───
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "dashboard" && user) { setView("dashboard"); setStep("dashboard"); }
      else if (hash === "prepare" && user) { setView("dashboard"); setStep("input"); }
      else if (hash === "plan" && user && plan) { setView("dashboard"); setStep("plan"); }
      else if (hash === "" || hash === "home") { setView("landing"); }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [user, plan]);

  // Update hash when view/step changes + track in analytics
  useEffect(() => {
    let newPath = window.location.pathname;
    if (view === "landing") { if (window.location.hash !== "") window.history.replaceState(null, "", window.location.pathname); }
    else if (step === "dashboard") { window.history.replaceState(null, "", "#dashboard"); newPath += "#dashboard"; }
    else if (step === "input") { window.history.replaceState(null, "", "#prepare"); newPath += "#prepare"; }
    else if (step === "plan") { window.history.replaceState(null, "", "#plan"); newPath += "#plan"; }
    // Track page view in GA if available
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", window.__GA_ID || "", { page_path: newPath });
    }
  }, [view, step]);

  // Charge le profil et les plans d'un utilisateur connecté
  const loadUserData = async (currentUser) => {
    setUser(currentUser);
    const hash = window.location.hash.replace("#", "");
    if (hash === "prepare") { setView("dashboard"); setStep("input"); }
    else { setView("dashboard"); setStep("dashboard"); }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const headers = { "Authorization": `Bearer ${session.access_token}` };
        // Charge profil + plans EN PARALLÈLE (2x plus rapide)
        const [profileResult, plansResult] = await Promise.allSettled([
          safeFetch("/api/profile", { headers }),
          safeFetch("/api/plans", { headers }),
        ]);
        if (profileResult.status === "fulfilled" && !profileResult.value.profileComplete) {
          const p = profileResult.value;
          setProfileData({ firstName: p.firstName || "", lastName: p.lastName || "", phone: p.phone || "", city: p.city || "", birthYear: p.birthYear || "" });
          setShowProfileForm(true);
        }
        if (plansResult.status === "fulfilled") {
          setSavedPlans(plansResult.value);
        }
      }
    } catch (e) { console.error("Session error:", e); }
  };

  useEffect(() => {
    // Check initial auth
    const checkAuth = async () => {
      try {
        const { data: { user: existingUser } } = await supabase.auth.getUser();
        if (existingUser) await loadUserData(existingUser);
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();

    // Écoute les changements d'auth en temps réel (Google OAuth, email confirm, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await loadUserData(session.user);
        setAuthLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setView("landing");
        setStep("input");
        setSavedPlans([]);
        setPlan(null);
        setJobData(null);
        setStats(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const fetchJobData = async () => {
    setJobLoading(true); setJobError("");
    try {
      jobUrlSchema.parse({ jobUrl, jobText, experienceLevel, interviewDate });
      const res = await safeFetch("/api/analyze-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl, jobText, experienceLevel }),
      });
      setJobData(res);
      setActiveTab("cv");
      setShowJobTextFallback(false);
    } catch (err) {
      // Handle Zod validation errors
      if (err?.errors) {
        setJobError(zodFirstError(err));
      } else if (err.message.includes("422")) {
        // Si erreur 422 (scraping échoué), proposer le mode texte
        setShowJobTextFallback(true);
        setJobError("Impossible d'accéder au site. Colle le texte de l'offre ci-dessous.");
      } else {
        setJobError(err.message);
      }
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
      // Calculer daysUntilInterview si interviewDate est fournie
      let daysUntilInterview = null;
      if (interviewDate) {
        daysUntilInterview = Math.ceil((new Date(interviewDate) - new Date()) / 86400000);
      }
      // Lecture streaming : le backend envoie des heartbeats (espaces) puis le JSON final
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobData, stats, intensity, experienceLevel, interviewerRole, interviewDate, daysUntilInterview }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const rawText = await response.text();
      const trimmed = rawText.trim();
      const res = JSON.parse(trimmed);
      if (res.error) throw new Error(res.error);
      if (!Array.isArray(res)) throw new Error("Format de plan invalide");
      setPlan(res);
      setStep("plan");

      // Auto-save to Supabase
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const saved = await safeFetch("/api/plans", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
            body: JSON.stringify({
              job_title: jobData?.title || jobData?.job_title || "Sans titre",
              company: jobData?.company || "",
              job_url: jobUrl,
              job_data: jobData,
              // RGPD : on ne stocke JAMAIS le CV en base, uniquement les métadonnées
              profile: { linkedinUrl, experienceLevel, interviewerRole },
              matches: stats?.matches || [],
              plan_data: res,
              next_interlocutor: interviewerRole || null,
              interview_date: interviewDate || null,
            }),
          });
          if (saved?.id) setCurrentPlanId(saved.id);
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

  const handleDeletePlan = async (planId) => {
    setDeletingPlan(planId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await safeFetch("/api/plans", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
          body: JSON.stringify({ id: planId }),
        });
        setSavedPlans(prev => prev.filter(p => p.id !== planId));
      }
    } catch (err) {
      console.error("Delete plan error:", err);
    } finally {
      setDeletingPlan(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange gère le reset automatiquement
  };

  const handleSendFeedback = async () => {
    try { feedbackSchema.parse({ type: feedbackType, message: feedbackMessage, rating: feedbackRating || undefined, planId: currentPlanId || undefined }); } catch (err) { alert(zodFirstError(err)); return; }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await safeFetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          type: feedbackType,
          message: feedbackMessage,
          rating: feedbackRating,
          page: step,
        }),
      });
      setFeedbackSent(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSent(false);
        setFeedbackMessage("");
        setFeedbackRating(0);
        setFeedbackType("Retour général");
      }, 2000);
    } catch (err) {
      console.error("Feedback error:", err);
      alert("Erreur lors de l'envoi du feedback");
    }
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { background: #0A0A0F; margin: 0; }
        ::selection { background: rgba(124,92,252,0.3); color: #fff; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 20px rgba(124,92,252,0.2); } 50% { box-shadow: 0 0 40px rgba(124,92,252,0.4); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        .glass:hover { border-color: rgba(255,255,255,0.15); }
        .btn-primary { background: linear-gradient(135deg, #7C5CFC, #5B8DEF); color: #fff; border: none; border-radius: 16px; padding: 12px 24px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(124,92,252,0.4); }
        /* ═══ Mobile: Editor / Plan View ═══ */
        @media (max-width: 768px) {
          /* ── Layout ── */
          .ez-plan-sidebar { display: none !important; }
          .ez-plan-main { grid-template-columns: 1fr !important; }
          .ez-plan-container { grid-template-columns: 1fr !important; padding: 10px !important; gap: 10px !important; }
          .ez-step { padding: 16px 12px !important; }
          .ez-step h1 { font-size: 24px !important; margin-bottom: 20px !important; }
          .ez-input-grid { grid-template-columns: 1fr !important; }

          /* ── Stepper tabs: horizontal scroll pills ── */
          .ez-stepper-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
          .ez-stepper-wrap::-webkit-scrollbar { display: none; }
          .ez-stepper-wrap > div { flex-wrap: nowrap !important; min-width: max-content !important; padding: 3px !important; }
          .ez-stepper-wrap button { padding: 10px 14px !important; font-size: 13px !important; flex: 0 0 auto !important; min-height: 44px !important; border-radius: 10px !important; white-space: nowrap !important; }

          /* ── Mobile day selector (pills bar) ── */
          .ez-plan-mobile-days { display: flex !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding: 4px 0 10px !important; }
          .ez-plan-mobile-days::-webkit-scrollbar { display: none; }
          .ez-plan-mobile-days button { min-height: 44px !important; padding: 10px 16px !important; font-size: 13px !important; }

          /* ── Plan day header ── */
          .ez-plan-day-header { padding: 16px !important; }
          .ez-plan-day-header h2 { font-size: 18px !important; margin-bottom: 4px !important; }
          .ez-plan-day-header p { font-size: 12px !important; }

          /* ── Plan items (cards) ── */
          .ez-plan-item { padding: 14px !important; margin-bottom: 8px !important; }
          .ez-plan-item h3 { font-size: 14px !important; }
          .ez-plan-item-content p { font-size: 13px !important; line-height: 1.6 !important; }
          .ez-plan-item-content .ez-key-point { font-size: 12px !important; padding: 8px 10px !important; }

          /* ── Nav (editor) ── */
          .ez-plan-nav-top { padding: 10px 14px !important; }
          .ez-plan-nav-top button { min-height: 44px !important; }

          /* ── Cards & inputs ── */
          .ez-card-mobile { padding: 16px !important; border-radius: 14px !important; }

          /* ── Matching grid (Léger/Standard/Intensif) ── */
          .ez-intensity-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
          .ez-intensity-grid button { min-height: 52px !important; }

          /* ── Modals: full-width on mobile ── */
          .ez-modal-overlay { padding: 12px !important; align-items: flex-end !important; }
          .ez-modal-content { max-width: 100% !important; border-radius: 20px 20px 0 0 !important; padding: 24px 20px !important; max-height: 90vh !important; overflow-y: auto !important; }
          .ez-modal-content h3 { font-size: 20px !important; }
          .ez-modal-content input, .ez-modal-content select, .ez-modal-content textarea { min-height: 44px !important; font-size: 16px !important; }
          .ez-modal-content button { min-height: 48px !important; font-size: 15px !important; }

          /* ── Profile form grid ── */
          .ez-profile-grid { grid-template-columns: 1fr !important; }

          /* ── Floating feedback button ── */
          .ez-fab { bottom: 16px !important; right: 16px !important; width: 52px !important; height: 52px !important; }

          /* ── Touch targets ── */
          button, a, select, input[type="file"] { min-height: 44px; }
          input, textarea, select { font-size: 16px !important; }

          /* ── Drag & drop zone ── */
          .ez-dropzone { padding: 24px 16px !important; }
          .ez-dropzone p { font-size: 13px !important; }

          /* ── Culture panel links ── */
          .ez-culture-links { flex-wrap: wrap !important; gap: 8px !important; }
          .ez-culture-links a { padding: 10px 14px !important; min-height: 44px !important; font-size: 12px !important; }

          /* ── Dashboard ── */
          .ez-dashboard-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .ez-dashboard-header button { width: 100% !important; }
          .ez-dashboard-grid { grid-template-columns: 1fr !important; gap: 12px !important; }

          /* ── Matching badges ── */
          .ez-match-badge { padding: 8px 12px !important; }
          .ez-match-badge span { font-size: 12px !important; }
        }

        @media (max-width: 480px) {
          .ez-plan-container { padding: 6px !important; }
          .ez-step { padding: 12px 8px !important; }
          .ez-step h1 { font-size: 20px !important; }
          .ez-plan-day-header { padding: 12px !important; }
          .ez-plan-day-header h2 { font-size: 16px !important; }
          .ez-plan-item { padding: 12px !important; }
          .ez-plan-item h3 { font-size: 13px !important; }
          .ez-plan-mobile-days button { padding: 8px 12px !important; font-size: 12px !important; }
          .ez-stepper-wrap button { padding: 8px 10px !important; font-size: 12px !important; }
          .ez-modal-content { padding: 20px 16px !important; }
          .ez-fab { bottom: 12px !important; right: 12px !important; width: 48px !important; height: 48px !important; font-size: 18px !important; }
        }
      `}</style>

      <nav className="ez-plan-nav-top" style={{ background: T.bgGlass, borderBottom: `1px solid ${T.border}`, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", backdropFilter: "blur(20px)" }}>
        <div onClick={() => setView("landing")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <Logo size={28} />
          <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>EZE</span>
        </div>
        <button onClick={() => setStep("dashboard")} style={btnS}>Mon espace</button>
      </nav>

      {step === "dashboard" && (
        <div className="ez-step" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
          <PlansDashboard
            plans={savedPlans}
            onSelect={async (id) => {
              setCurrentPlanId(id);
              setLoadingPlan(id);
              try {
                const { data: { session } } = await supabase.auth.getSession();
                const fullPlan = await safeFetch(`/api/plans/${id}`, { headers: { "Authorization": `Bearer ${session.access_token}` } });
                if (fullPlan?.plan_data) {
                  setPlan(fullPlan.plan_data);
                  setJobData(fullPlan.job_data);
                  setStep("plan");
                }
              } catch (e) { console.error("Load plan error:", e); }
              setLoadingPlan(null);
            }}
            loadingPlan={loadingPlan}
            onNew={() => { setStep("input"); setActiveTab("offer"); setPlan(null); setJobData(null); setStats(null); setCvText(""); setCvFile(null); setJobUrl(""); setExperienceLevel(""); setInterviewerRole(""); setInterviewDate(""); }}
            onDelete={handleDeletePlan}
            deletingPlan={deletingPlan}
            user={user}
            onLogout={handleLogout}
          />
        </div>
      )}

      {step === "input" && (
        <div className="ez-step" style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
          <h1 style={{ margin: "0 0 28px", fontSize: 36, fontWeight: 700, color: T.text }}>Préparer mon entretien</h1>

          {/* ─── Stepper tabs ─── */}
          <div className="ez-stepper-wrap" style={{ display: "flex", gap: 0, marginBottom: 32, background: T.bgGlass, borderRadius: 16, padding: 4, border: `1px solid ${T.border}`, backdropFilter: "blur(10px)" }}>
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
                    flex: 1, padding: "14px 0", border: "none", borderRadius: 12,
                    background: isActive ? T.accentGradient : "transparent",
                    color: isActive ? "#fff" : isLocked ? T.light : T.text,
                    fontWeight: isActive ? 700 : 500, fontSize: 14,
                    cursor: isLocked ? "not-allowed" : "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    opacity: isLocked ? 0.5 : 1,
                    transition: "all 0.2s",
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
              <input type="url" placeholder="LinkedIn, Indeed, Welcome to the Jungle, Apec..." value={jobUrl} onChange={(e) => setJobUrl(e.target.value)} style={inp} />
              <p style={{ margin: "4px 0 0", fontSize: 11, color: T.muted }}>Compatible avec LinkedIn, Indeed, Welcome to the Jungle, Apec, HelloWork, Glassdoor, Cadremploi et plus</p>

              <label style={{ display: "block", marginTop: 16, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Votre niveau d'expérience dans ce domaine <span style={{ color: T.red }}>*</span></label>
              <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} style={inp}>
                <option value="">Sélectionner...</option>
                <option value="Junior (0-2 ans)">Junior (0-2 ans)</option>
                <option value="Confirmé (3-7 ans)">Confirmé (3-7 ans)</option>
                <option value="Senior (8+ ans)">Senior (8+ ans)</option>
              </select>

              <label style={{ display: "block", marginTop: 16, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Date de l'entretien (optionnel)</label>
              <input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} min={addDays(today(), 1)} max={addDays(today(), 30)} style={inp} />
              {interviewDate && (() => {
                const days = Math.ceil((new Date(interviewDate) - new Date()) / 86400000);
                return <p style={{ margin: "6px 0 0", fontSize: 12, color: days <= 3 ? T.red : days <= 7 ? T.warn : T.green, fontWeight: 500 }}>J-{days} — {days <= 3 ? "Préparation express !" : days <= 7 ? "Préparation standard" : "Préparation approfondie"} · Le plan couvrira chaque jour jusqu'à l'entretien</p>;
              })()}

              {jobError && <p style={{ color: T.red, fontSize: 13, margin: "12px 0 0" }}>{jobError}</p>}

              {/* Fallback : coller le texte de l'offre */}
              {showJobTextFallback && (
                <div style={{ marginTop: 16, padding: 16, borderRadius: T.r, background: T.warnLt, border: `1px solid ${T.warnBd}` }}>
                  <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: T.warn }}>Le site bloque l'accès automatique</p>
                  <p style={{ margin: "0 0 12px", fontSize: 12, color: T.muted }}>Copie-colle le texte de l'annonce ici. Va sur la page de l'offre, sélectionne tout le texte (Ctrl+A) et colle-le.</p>
                  <textarea placeholder="Colle le texte complet de l'offre d'emploi ici..." value={jobText} onChange={(e) => setJobText(e.target.value)} style={{ ...inp, minHeight: 150, fontSize: 12, fontFamily: "monospace" }} />
                </div>
              )}

              <button onClick={fetchJobData} disabled={jobLoading || (!jobUrl && !jobText) || !experienceLevel} style={{ ...((!jobUrl && !jobText) || !experienceLevel ? btnD : btnP), marginTop: 16, width: "100%" }}>
                {jobLoading ? "Analyse en cours..." : showJobTextFallback && jobText ? "Analyser le texte collé" : "Analyser l'offre"}
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
              <div className="ez-dropzone"
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
                  background: dragOver ? T.accentLt : T.bgCard,
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
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📄</div>
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
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: T.r, background: m.match === "strong" ? T.greenLt : m.match === "partial" ? T.warnLt : T.redLt, border: `1px solid ${m.match === "strong" ? T.greenBd : m.match === "partial" ? T.warnBd : T.redBd}` }}>
                        <Badge v={m.match}>{m.match === "strong" ? "Acquis" : m.match === "partial" ? "Partiel" : "À travailler"}</Badge>
                        <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{m.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={card}>
                <label style={{ display: "block", marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Qui sera en face de toi ? (optionnel)</label>
                <input type="text" placeholder="Ex : CTO, DRH, Manager technique, Lead Developer..." value={interviewerRole} onChange={(e) => setInterviewerRole(e.target.value)} style={inp} />
                <p style={{ margin: "6px 0 0", fontSize: 11, color: T.muted }}>Précise le poste de ton interlocuteur pour adapter la préparation</p>
              </div>

              <div style={card}>
                <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: T.text }}>Intensité de préparation</h3>
                <div className="ez-intensity-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {["Léger", "Standard", "Intensif"].map((i) => (
                    <button key={i} onClick={() => setIntensity(i)} style={{ padding: 14, borderRadius: T.r, border: `2px solid ${intensity === i ? T.accent : T.border}`, background: intensity === i ? T.accentLt : T.bgCard, color: T.text, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
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
                    L'IA construit ton plan sur mesure avec les meilleures ressources. Cela prend généralement 2 à 3 minutes.
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
        <div className="ez-plan-container" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 24, padding: 24, maxWidth: "100%", margin: "0 auto" }}>
          {/* Desktop sidebar */}
          <div className="ez-plan-sidebar" style={{ display: "flex", flexDirection: "column", gap: 8, position: "sticky", top: 80, alignSelf: "start" }}>
            <button onClick={() => { setStep("dashboard"); setExpandedItems({}); }} style={{ ...btnS, marginBottom: 8, fontSize: 12 }}>← Mes préparations</button>
            {plan.map((day, i) => (
              <button key={i} onClick={() => { setExpandedDay(i); setExpandedItems({}); }} style={{ padding: "12px 14px", borderRadius: T.r, border: `1px solid ${expandedDay === i ? T.accent : T.border}`, background: expandedDay === i ? T.accentLt : T.bgCard, color: T.text, textAlign: "left", cursor: "pointer", fontFamily: "inherit", fontWeight: expandedDay === i ? 700 : 500, fontSize: 13, transition: "all 0.2s" }}>
                <span style={{ fontWeight: 700 }}>J{i + 1}</span> — {day.title?.slice(0, 25)}{day.title?.length > 25 ? "…" : ""}
              </button>
            ))}
          </div>

          {/* Mobile horizontal day selector */}
          <div className="ez-plan-mobile-days" style={{ display: "none", overflowX: "auto", gap: 6, paddingBottom: 8, WebkitOverflowScrolling: "touch", gridColumn: "1 / -1" }}>
            <button onClick={() => { setStep("dashboard"); setExpandedItems({}); }} style={{ ...btnS, padding: "6px 10px", fontSize: 11, flexShrink: 0, whiteSpace: "nowrap" }}>←</button>
            {plan.map((day, i) => (
              <button key={i} onClick={() => { setExpandedDay(i); setExpandedItems({}); }}
                style={{
                  padding: "8px 12px", borderRadius: 20, border: `1px solid ${expandedDay === i ? T.accent : T.border}`,
                  background: expandedDay === i ? T.accent : T.bgCard, color: expandedDay === i ? "#fff" : T.text,
                  fontWeight: expandedDay === i ? 700 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                  flexShrink: 0, whiteSpace: "nowrap",
                }}>
                <span style={{ fontWeight: 600 }}>J{i + 1}</span> {plan[i].title?.slice(0, 15)}{plan[i].title?.length > 15 ? "…" : ""}
              </button>
            ))}
          </div>

          <div className="ez-plan-main" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            {plan[expandedDay] && (
              <>
                <div className="ez-plan-day-header" style={{ ...card }}>
                  <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: T.text }}>Jour {expandedDay + 1} — {plan[expandedDay].title}</h2>
                  <p style={{ margin: 0, fontSize: 12, color: T.muted }}>{plan[expandedDay].focus}</p>
                  {/* Day navigation */}
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    {expandedDay > 0 && <button onClick={() => { setExpandedDay(expandedDay - 1); setExpandedItems({}); }} style={{ ...btnS, padding: "6px 14px", fontSize: 12 }}>← Jour {expandedDay}</button>}
                    {expandedDay < plan.length - 1 && <button onClick={() => { setExpandedDay(expandedDay + 1); setExpandedItems({}); }} style={{ ...btnS, padding: "6px 14px", fontSize: 12 }}>Jour {expandedDay + 2} →</button>}
                  </div>
                </div>

                {(expandedDay === 0 || jobData?.companyInfo) && <CulturePanel companyInfo={jobData?.companyInfo} jobData={jobData} />}

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan[expandedDay].items?.map((item, i) => (
                    <div key={i} className="ez-plan-item" style={{ ...card, marginBottom: 0 }}>
                      <div onClick={() => setExpandedItems(p => ({ ...p, [i]: !p[i] }))} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>{item.title}</h3>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <Badge v={typeV[item.type] || "default"}>{typeL[item.type] || item.type}</Badge>
                            {item.duration && <span style={{ fontSize: 11, color: T.muted }}>{item.duration}</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <button onClick={(e) => { e.stopPropagation(); setReportingItem({ day: expandedDay, item: i, title: item.title }); }} style={{ background: "transparent", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", padding: 4, fontFamily: "inherit", transition: "all 0.2s" }} title="Signaler une erreur">⚠</button>
                          <span style={{ color: T.muted, fontSize: 12 }}>{expandedItems[i] ? "▼" : "▶"}</span>
                        </div>
                      </div>
                      {expandedItems[i] && <div className="ez-plan-item-content"><ItemContent item={item} /></div>}
                      {reportingItem?.day === expandedDay && reportingItem?.item === i && (
                        <div style={{ marginTop: 12, padding: 12, borderRadius: T.r, background: T.warnLt, border: `1px solid ${T.warnBd}` }}>
                          <textarea placeholder="Décris le problème..." value={reportText} onChange={(e) => setReportText(e.target.value)} style={{ ...inp, minHeight: 60, marginBottom: 8 }} />
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={async () => {
                              try { reportSchema.parse({ planId: currentPlanId, dayIndex: expandedDay, itemIndex: i, itemTitle: item.title, reason: reportText }); } catch (err) { alert(zodFirstError(err)); return; }
                              try {
                                const { data: { session: reportSession } } = await supabase.auth.getSession();
                                await safeFetch("/api/report", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${reportSession?.access_token}` },
                                  body: JSON.stringify({ planId: currentPlanId, dayIndex: expandedDay, itemIndex: i, itemTitle: item.title, reason: reportText }),
                                });
                                alert("Merci pour ton signalement !");
                                setReportingItem(null);
                                setReportText("");
                              } catch (err) {
                                console.error("Report error:", err);
                                alert("Erreur lors du signalement");
                              }
                            }} style={{ ...btnP, padding: "8px 14px", fontSize: 12, flex: 1 }}>Envoyer</button>
                            <button onClick={() => { setReportingItem(null); setReportText(""); }} style={{ ...btnS, padding: "8px 14px", fontSize: 12 }}>Annuler</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Feedback Button (only when logged in, not on landing) */}
      {user && view !== "landing" && (
        <button className="ez-fab" onClick={() => setShowFeedback(true)} style={{
          position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%",
          background: T.accentGradient, color: "#fff", border: "none", fontSize: 20, cursor: "pointer",
          boxShadow: "0 8px 24px rgba(124,92,252,0.35)", display: "flex", alignItems: "center",
          justifyContent: "center", fontFamily: "inherit", zIndex: 50, transition: "all 0.2s ease"
        }} onMouseEnter={(e) => e.target.style.transform = "scale(1.15)"} onMouseLeave={(e) => e.target.style.transform = "scale(1)"}>
          💬
        </button>
      )}

      {/* Profile Completion Modal */}
      {showProfileForm && (
        <div className="ez-modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(10,10,15,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, padding: 16 }}>
          <div className="ez-modal-content" style={{ maxWidth: 460, width: "100%", background: T.bgGlass, borderRadius: 20, padding: 32, position: "relative", boxShadow: "0 24px 64px rgba(124,92,252,0.2)", animation: "fadeIn 0.25s ease", border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: T.accentGradient, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12, boxShadow: "0 8px 24px rgba(124,92,252,0.3)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.text }}>Complète ton profil</h3>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: T.muted }}>Pour personnaliser ton expérience</p>
            </div>

            <div className="ez-profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Prénom <span style={{ color: T.red }}>*</span></label>
                <input type="text" placeholder="Jean" value={profileData.firstName} onChange={(e) => setProfileData(p => ({ ...p, firstName: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Nom <span style={{ color: T.red }}>*</span></label>
                <input type="text" placeholder="Dupont" value={profileData.lastName} onChange={(e) => setProfileData(p => ({ ...p, lastName: e.target.value }))} style={inp} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Téléphone</label>
              <input type="tel" placeholder="06 12 34 56 78" value={profileData.phone} onChange={(e) => setProfileData(p => ({ ...p, phone: e.target.value }))} style={inp} />
            </div>

            <div className="ez-profile-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Ville</label>
                <input type="text" placeholder="Paris" value={profileData.city} onChange={(e) => setProfileData(p => ({ ...p, city: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 4 }}>Année de naissance</label>
                <input type="number" placeholder="1995" min="1950" max="2010" value={profileData.birthYear} onChange={(e) => setProfileData(p => ({ ...p, birthYear: e.target.value }))} style={inp} />
              </div>
            </div>

            <button onClick={async () => {
              if (!profileData.firstName.trim() || !profileData.lastName.trim()) { alert("Nom et prénom obligatoires"); return; }
              try {
                const { data: { session } } = await supabase.auth.getSession();
                await safeFetch("/api/profile", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                  body: JSON.stringify(profileData),
                });
                setShowProfileForm(false);
              } catch (err) {
                console.error("Profile save error:", err);
                alert("Erreur lors de la sauvegarde");
              }
            }} disabled={!profileData.firstName.trim() || !profileData.lastName.trim()} style={{ ...(!profileData.firstName.trim() || !profileData.lastName.trim() ? btnD : btnP), width: "100%" }}>
              Enregistrer
            </button>

            <button onClick={() => setShowProfileForm(false)} style={{ ...btnS, width: "100%", marginTop: 8, fontSize: 12, color: T.muted }}>
              Plus tard
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="ez-modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(10,10,15,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) setShowFeedback(false); }}>
          <div className="ez-modal-content" style={{ maxWidth: 420, width: "100%", background: T.bgGlass, borderRadius: 20, padding: 28, position: "relative", boxShadow: "0 24px 64px rgba(124,92,252,0.2)", animation: "fadeIn 0.25s ease", border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}>
            <button onClick={() => setShowFeedback(false)} style={{ position: "absolute", top: 16, right: 16, background: T.bgSoft, border: `1px solid ${T.border}`, fontSize: 16, color: T.muted, cursor: "pointer", fontFamily: "inherit", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}>✕</button>

            {!feedbackSent ? (
              <>
                <h3 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800, color: T.text }}>Ton avis nous aide !</h3>

                <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 600, color: T.muted }}>Type de retour</label>
                <select value={feedbackType} onChange={(e) => setFeedbackType(e.target.value)} style={{ ...inp, marginBottom: 16 }}>
                  <option>Retour général</option>
                  <option>Bug</option>
                  <option>Nouvelle fonctionnalité</option>
                  <option>Amélioration</option>
                </select>

                <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 600, color: T.muted }}>Message</label>
                <textarea placeholder="Dis-nous ce que tu penses..." value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} style={{ ...inp, minHeight: 80, marginBottom: 16 }} />

                <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 600, color: T.muted }}>Ton avis (optionnel)</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button key={r} onClick={() => setFeedbackRating(r)} style={{ fontSize: 24, background: "transparent", border: "none", cursor: "pointer", opacity: feedbackRating >= r ? 1 : 0.3, transition: "all 0.2s" }}>
                      ⭐
                    </button>
                  ))}
                </div>

                <button onClick={handleSendFeedback} style={{ ...btnP, width: "100%" }}>Envoyer</button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.green }}>Merci pour ton feedback !</p>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: T.muted }}>On l'a bien reçu</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
