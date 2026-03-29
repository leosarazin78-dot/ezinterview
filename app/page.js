"use client";
import { useState, useCallback } from "react";

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
  return `${["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][dt.getDay()]} ${dt.getDate()} ${["jan","fév","mar","avr","mai","jun","jul","aoû","sep","oct","nov","déc"][dt.getMonth()]}`;
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

// ─── MAIN ───
export default function EzInterview() {
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

  // ─── API calls ───
  const handleFetchJob = useCallback(async () => {
    if (!jobUrl.trim()) return;
    setJobLoading(true); setJobError("");
    try {
      const res = await fetch("/api/scrape-job", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setJobData(data);
      if (data.interviewSteps?.length > 0) {
        setInterviewSteps(data.interviewSteps);
        setManualStepMode(false);
        setNextInterlocutor(data.interviewSteps[0].interlocutor || "");
      } else { setManualStepMode(true); }
      // Fetch company intel in background
      if (data.company) {
        fetch("/api/company-intel", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company: data.company, sector: data.companyInfo?.sector }),
        }).then(r => r.json()).then(info => {
          if (!info.error) setCompanyInfo(info);
        }).catch(() => {});
      }
    } catch (err) { setJobError(err.message); }
    setJobLoading(false);
  }, [jobUrl]);

  const handleAnalyze = async () => {
    if (!jobData || (!cvText.trim() && !cvFile)) return;
    setAnalysisLoading(true); setStep("analysis"); setError("");
    try {
      // Parse CV first
      let profileData = profile;
      if (!profileData) {
        const formData = new FormData();
        if (cvFile) formData.append("file", cvFile);
        else formData.append("text", cvText);
        if (linkedinUrl) formData.append("linkedin", linkedinUrl);
        const cvRes = await fetch("/api/parse-cv", { method: "POST", body: formData });
        const cvData = await cvRes.json();
        if (!cvRes.ok) throw new Error(cvData.error || "Erreur parsing CV");
        setProfile(cvData);
        profileData = cvData;
      }
      // Then analyze matches
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobData, profile: profileData, extras }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur analyse");
      setMatches(data);
    } catch (err) { setError(err.message); }
    setAnalysisLoading(false);
  };

  const handleGeneratePlan = async () => {
    if (selectedPriorities.length === 0 || !interviewDate) return;
    setPlanLoading(true); setError("");
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobData, matches, priorities: selectedPriorities,
          interviewDate, nextInterlocutor, companyInfo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur génération");
      setPrepPlan(data);
      setStep("plan");
    } catch (err) { setError(err.message); }
    setPlanLoading(false);
  };

  const handleAddManualStep = () => {
    if (!newStepLabel.trim()) return;
    const ns = { step: interviewSteps.length + 1, label: newStepLabel.trim(), interlocutor: newStepPerson.trim() || "Non précisé", duration: "", type: newStepType };
    setInterviewSteps(p => [...p, ns]);
    if (interviewSteps.length === 0) setNextInterlocutor(ns.interlocutor);
    setNewStepLabel(""); setNewStepPerson(""); setNewStepType("visio");
  };

  const togglePriority = (id) => setSelectedPriorities(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleDayComplete = (d) => {
    if (d > 1 && !completedDays[d - 1]) return;
    setCompletedDays(p => {
      const n = { ...p };
      if (n[d]) { for (let i = d; i <= prepPlan.length; i++) delete n[i]; }
      else n[d] = true;
      return n;
    });
  };

  const isInputComplete = jobData && (cvText.trim() || cvFile);
  const getPlanDate = (idx) => { if (!interviewDate) return ""; return addDays(interviewDate, -(prepPlan.length) + idx); };
  const completedCount = Object.keys(completedDays).length;
  const daysUntil = interviewDate ? Math.max(0, Math.ceil((new Date(interviewDate) - new Date()) / 86400000)) : 0;

  const ErrorBanner = ({ msg }) => msg ? (
    <div style={{ padding: "10px 14px", borderRadius: T.r, background: T.badBg, border: `1px solid ${T.badBd}`, color: T.bad, fontSize: 13, marginBottom: 12 }}>{msg}</div>
  ) : null;

  // ─── Step indicator ───
  const Steps = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
      {[
        { k: "input", l: "1. Informations", d: step !== "input" },
        { k: "analysis", l: "2. Analyse", d: step === "plan" },
        { k: "plan", l: "3. Plan", d: false },
      ].map((s, i, a) => (
        <div key={s.k} style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            padding: "6px 14px", borderRadius: T.r, fontSize: 13,
            background: s.k === step ? T.accent : s.d ? T.mintBg : "#EDEAE4",
            color: s.k === step ? "#fff" : s.d ? T.mint : T.muted,
            fontWeight: s.k === step ? 600 : 400,
            border: `1px solid ${s.k === step ? T.accent : s.d ? T.mintBd : T.border}`,
          }}>{s.d ? "OK " : ""}{s.l}</div>
          {i < a.length - 1 && <div style={{ width: 32, height: 1, background: T.border, margin: "0 4px" }} />}
        </div>
      ))}
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
                {/* Company intel */}
                {(companyInfo || jobData.companyInfo) && (
                  <div style={{ marginTop: 16, borderTop: `1px solid ${T.mintBd}`, paddingTop: 12 }}>
                    <div style={{ cursor: "pointer", display: "flex", justifyContent: "space-between" }} onClick={() => setShowCompanyInfo(!showCompanyInfo)}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Infos entreprise & actualités</span>
                      <span style={{ fontSize: 12, color: T.muted }}>{showCompanyInfo ? "Masquer" : "Voir"}</span>
                    </div>
                    {showCompanyInfo && (() => {
                      const ci = companyInfo || jobData.companyInfo;
                      return (
                        <div style={{ marginTop: 10, fontSize: 13 }}>
                          <p style={{ margin: "0 0 6px", color: T.muted }}>
                            {ci.founded && `Fondée en ${ci.founded} · `}{ci.hq} · {ci.employees} employés · {ci.sector}
                          </p>
                          {ci.recentNews?.length > 0 && <>
                            <p style={{ margin: "0 0 4px", fontWeight: 500, fontSize: 12 }}>Actualités :</p>
                            {ci.recentNews.map((n, i) => <p key={i} style={{ margin: "0 0 3px", fontSize: 12, paddingLeft: 8 }}>— {n}</p>)}
                          </>}
                          {ci.competitors?.length > 0 && <>
                            <p style={{ margin: "8px 0 4px", fontWeight: 500, fontSize: 12 }}>Concurrents :</p>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{ci.competitors.map(c => <Badge key={c} v="info">{c}</Badge>)}</div>
                          </>}
                          {ci.techStack?.length > 0 && <>
                            <p style={{ margin: "8px 0 4px", fontWeight: 500, fontSize: 12 }}>Stack :</p>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{ci.techStack.map(t => <Badge key={t} v="tech">{t}</Badge>)}</div>
                          </>}
                        </div>
                      );
                    })()}
                  </div>
                )}
                <p style={{ margin: "10px 0 0", fontSize: 12, color: T.light }}>Extrait depuis {jobData.source}</p>
              </div>
            )}
          </div>
          {/* Interview steps */}
          {jobData && !jobLoading && (
            <div style={card}>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Étapes de l'entretien</h3>
              {interviewSteps.length > 0 && !manualStepMode && <p style={{ margin: "0 0 12px", fontSize: 13, color: T.mint }}>Détectées depuis l'offre</p>}
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
                  {interviewSteps.length === 0 && <p style={{ margin: "0 0 12px", fontSize: 13, color: T.muted }}>Pas détectées — ajoute-les pour adapter le plan.</p>}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-end" }}>
                    <div style={{ flex: "1 1 140px" }}><label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 3 }}>Étape</label><input style={inp} placeholder="Technical Interview" value={newStepLabel} onChange={e => setNewStepLabel(e.target.value)} /></div>
                    <div style={{ flex: "1 1 140px" }}><label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 3 }}>Interlocuteur</label><input style={inp} placeholder="Lead Engineer" value={newStepPerson} onChange={e => setNewStepPerson(e.target.value)} /></div>
                    <div style={{ flex: "0 0 100px" }}><label style={{ fontSize: 12, color: T.muted, display: "block", marginBottom: 3 }}>Format</label><select style={{ ...inp, cursor: "pointer" }} value={newStepType} onChange={e => setNewStepType(e.target.value)}><option value="visio">Visio</option><option value="sur site">Sur site</option><option value="tel">Téléphone</option><option value="take home">Take home</option></select></div>
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
          <p style={{ margin: "0 0 16px", fontSize: 13, color: T.muted }}>Upload ou colle le texte. Tous les formats acceptés.</p>
          <div style={{ border: `2px dashed ${cvFile ? T.mintBd : T.border}`, borderRadius: T.r, padding: "28px 16px", textAlign: "center", marginBottom: 12, cursor: "pointer", background: cvFile ? T.mintBg : "#FAFAF6" }} onClick={() => document.getElementById("cv-upload").click()}>
            <input id="cv-upload" type="file" accept=".pdf,.docx,.doc,.txt,.rtf,.odt,.png,.jpg" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) { setCvFile(e.target.files[0]); setCvText(""); setProfile(null); } }} />
            {cvFile ? <div><p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{cvFile.name}</p><p style={{ margin: "2px 0 0", fontSize: 12, color: T.muted }}>{(cvFile.size / 1024).toFixed(0)} Ko — Cliquer pour changer</p></div>
              : <div><p style={{ margin: 0, fontSize: 14, color: T.muted }}>Glisser-déposer ou <span style={{ color: T.text, fontWeight: 500, textDecoration: "underline" }}>parcourir</span></p><p style={{ margin: "4px 0 0", fontSize: 12, color: T.light }}>PDF, DOCX, TXT, RTF, ODT, PNG, JPG</p></div>}
          </div>
          <div style={{ textAlign: "center", fontSize: 12, color: T.light, margin: "8px 0" }}>ou</div>
          <textarea style={{ ...inp, minHeight: 100, resize: "vertical" }} placeholder="Colle ton CV texte ici..." value={cvText} onChange={e => { setCvText(e.target.value); setCvFile(null); setProfile(null); }} />
          <div style={{ marginTop: 20 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Profil LinkedIn <span style={{ fontSize: 12, color: T.light, fontWeight: 400 }}>(optionnel)</span></h3>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: T.muted }}>Pour affiner l'analyse avec tes compétences et recommandations</p>
            <input style={inp} placeholder="https://linkedin.com/in/ton-profil" value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} />
          </div>
          <div style={{ marginTop: 20 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Petits plus <span style={{ fontSize: 12, color: T.light, fontWeight: 400 }}>(optionnel)</span></h3>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: T.muted }}>Technos à creuser, points techniques à renforcer...</p>
            <textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} placeholder="Ex: Je veux m'améliorer en system design..." value={extras} onChange={e => setExtras(e.target.value)} />
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <button style={isInputComplete ? btnP : btnD} onClick={handleAnalyze} disabled={!isInputComplete}>Analyser la compatibilité</button>
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
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Correspondances techniques</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: T.muted }}>Sélectionne les sujets prioritaires</p>
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

          {/* Company */}
          {(companyInfo || jobData?.companyInfo) && (
            <div style={card}>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Veille : {jobData?.company}</h3>
              {(() => { const ci = companyInfo || jobData.companyInfo; return (
                <div style={{ fontSize: 13 }}>
                  {ci.recentNews?.length > 0 && <div style={{ marginBottom: 10 }}><span style={{ fontWeight: 500, fontSize: 12 }}>Actualités :</span>{ci.recentNews.map((n, i) => <p key={i} style={{ margin: "3px 0", paddingLeft: 8, fontSize: 13 }}>— {n}</p>)}</div>}
                  {ci.competitors?.length > 0 && <div style={{ marginBottom: 10 }}><span style={{ fontWeight: 500, fontSize: 12 }}>Concurrents :</span><div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>{ci.competitors.map(c => <Badge key={c} v="info">{c}</Badge>)}</div></div>}
                  {ci.techStack?.length > 0 && <div><span style={{ fontWeight: 500, fontSize: 12 }}>Stack :</span><div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>{ci.techStack.map(t => <Badge key={t} v="tech">{t}</Badge>)}</div></div>}
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
            {interviewDate && <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13, color: T.muted }}>{daysUntil} jours de préparation{nextInterlocutor ? ` — avec ${nextInterlocutor}` : ""}</p>}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button style={(selectedPriorities.length > 0 && interviewDate) ? btnP : btnD} onClick={handleGeneratePlan} disabled={selectedPriorities.length === 0 || !interviewDate || planLoading}>{planLoading ? "Génération du plan..." : `Générer mon plan (${selectedPriorities.length} sujets)`}</button>
          </div>
        </>
      )}
    </>
  );

  // ─── STEP 3 ───
  const step3 = () => (
    <>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div><h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Plan de préparation</h3><p style={{ margin: "2px 0 0", fontSize: 13, color: T.muted }}>{jobData?.title} chez {jobData?.company}{nextInterlocutor ? ` — prochain : ${nextInterlocutor}` : ""}</p></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btnS} onClick={() => { setStep("analysis"); setPrepPlan([]); setCompletedDays({}); }}>Modifier</button>
            <button style={notificationsEnabled ? { ...btnS, background: T.mintBg, borderColor: T.mintBd } : btnP} onClick={() => { if ("Notification" in window) Notification.requestPermission(); setNotificationsEnabled(true); }}>{notificationsEnabled ? "Rappels actifs" : "Activer rappels"}</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: 16, borderRadius: T.r, background: T.accentLt, border: `1px solid ${T.accentBd}` }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 700, color: T.accent }}>{completedCount}/{prepPlan.length}</div><div style={{ fontSize: 12, color: T.muted }}>sessions</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 700, color: T.accent }}>{prepPlan.length > 0 ? Math.round((completedCount / prepPlan.length) * 100) : 0}%</div><div style={{ fontSize: 12, color: T.muted }}>réalisé</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 700, color: daysUntil <= 2 ? T.coral : T.accent }}>{daysUntil}j</div><div style={{ fontSize: 12, color: T.muted }}>restants</div></div>
        </div>
        <div style={{ marginTop: 10 }}><Bar value={completedCount} max={prepPlan.length} color={T.accent} h={8} /></div>
      </div>

      {/* Grid */}
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
                {day.items?.map((it, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: T.r, background: done ? T.mintBg : it.type === "quiz" ? T.quizBg : "#FAFAF6", border: `1px solid ${done ? T.mintBd : it.type === "quiz" ? T.quizBd : "#EDE9E3"}`, opacity: done ? 0.7 : 1 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, textDecoration: done ? "line-through" : "none", color: done ? T.muted : T.text }}>{it.title}</div>
                      <div style={{ fontSize: 12, color: T.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                        <Badge v={done ? "default" : typeV[it.type] || "default"}>{typeL[it.type] || it.type}</Badge>
                        <span>{it.duration}</span>
                      </div>
                    </div>
                    {!done && <button style={{ ...btnS, padding: "6px 12px", fontSize: 12 }}>{it.type === "exercise" ? "Commencer" : it.type === "video" ? "Regarder" : it.type === "quiz" ? "Lancer" : "Lire"}</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {notificationsEnabled && <div style={{ padding: "12px 16px", borderRadius: T.r, background: T.mintBg, border: `1px solid ${T.mintBd}`, fontSize: 13, color: T.mint }}>Rappel quotidien activé</div>}
    </>
  );

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 740, margin: "0 auto", padding: "24px 16px", color: T.text, lineHeight: 1.55, background: T.bg, minHeight: "100vh" }}>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", color: T.accent }}>EzInterview</span>
        <span style={{ fontSize: 11, color: T.light, background: T.accentLt, padding: "2px 8px", borderRadius: T.r, border: `1px solid ${T.accentBd}` }}>beta</span>
      </div>
      <Steps />
      {step === "input" && step1()}
      {step === "analysis" && step2()}
      {step === "plan" && step3()}
    </div>
  );
}