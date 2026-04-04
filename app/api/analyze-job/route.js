import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import { extractJSONObject } from "../../lib/parse-json";

const anthropic = new Anthropic();

async function fetchJobPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, nav, footer, header, aside, iframe, noscript").remove();
    const text = $("body").text().replace(/\s+/g, " ").trim();
    return text.slice(0, 8000);
  } catch (err) {
    console.error("Scrape error:", err.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const { jobUrl, experienceLevel } = await request.json();
    const url = jobUrl;
    if (!url) return Response.json({ error: "URL manquante" }, { status: 400 });

    const pageText = await fetchJobPage(url);
    if (!pageText) {
      return Response.json(
        { error: "Impossible d'acceder a cette page. Verifie le lien." },
        { status: 422 }
      );
    }

    let source = "site";
    if (url.includes("linkedin")) source = "linkedin.com";
    else if (url.includes("indeed")) source = "indeed.com";
    else if (url.includes("welcometothejungle") || url.includes("wttj"))
      source = "welcometothejungle.com";
    else {
      try { source = new URL(url).hostname; } catch {}
    }

    const levelContext = experienceLevel
      ? `\nNiveau d'experience du candidat : ${experienceLevel}. Adapte le niveau d'exigence attendu pour chaque competence en consequence.`
      : "";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Analyse cette offre d'emploi et extrais les informations en JSON strict. Ne retourne QUE le JSON.
${levelContext}

Texte de la page :
${pageText}

Format attendu :
{
  "title": "Titre du poste",
  "company": "Nom de l'entreprise",
  "location": "Lieu",
  "type": "CDI/CDD/Stage/Freelance",
  "salary": "Salaire si mentionne ou null",
  "description": "Description courte du poste (2-3 phrases)",
  "requirements": [
    {"id": 1, "label": "Competence ou connaissance requise", "category": "pro", "level": "Avance/Intermediaire/Basique"}
  ],
  "interviewSteps": [
    {"step": 1, "label": "Nom de l'etape", "interlocutor": "Qui", "duration": "Duree", "type": "visio/sur site/tel"}
  ],
  "companyInfo": {
    "sector": "Secteur d'activite",
    "techStack": ["Outil/methode/techno 1", "Outil/methode/techno 2"]
  }
}

IMPORTANT :
- requirements : extrais les competences PROFESSIONNELLES et METIER demandees (techniques, outils, connaissances sectorielles, methodologies, certifications). Pas de soft skills ni de langues.
  Adapte au domaine : "React" pour un dev, "Modelisation financiere" pour un analyste, "Droit des contrats" pour un juriste, "SEO/SEA" pour un marketeur, "Normes IFRS" pour un comptable, "AutoCAD" pour un architecte, "Soudure TIG" pour un artisan, "Pedagogie differenciee" pour un enseignant
- interviewSteps : extrais-les si le processus est decrit dans l'offre, sinon retourne un tableau vide []
- companyInfo.techStack : liste les outils, technologies, methodes ou frameworks mentionnes
- Retourne UNIQUEMENT le JSON valide`,
        },
      ],
    });

    const text = message.content[0].text;
    const jobData = extractJSONObject(text);
    if (!jobData)
      return Response.json({ error: "Erreur d'analyse de l'offre. Reessaie." }, { status: 500 });

    jobData.source = source;
    return Response.json(jobData);
  } catch (err) {
    console.error("Analyze-job error:", err);
    return Response.json(
      { error: "Erreur serveur : " + err.message },
      { status: 500 }
    );
  }
}
