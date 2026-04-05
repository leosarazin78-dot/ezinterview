import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import { extractJSONObject } from "../../lib/parse-json";
import { createRateLimit, rateLimitResponse } from "../../lib/rate-limit";
import { sanitizeUrl, sanitizeString } from "../../lib/sanitize";

const anthropic = new Anthropic();

// Rate limit : 15 analyses d'offre par heure par IP
const checkLimit = createRateLimit({ key: "analyze-job", maxRequests: 15, windowMs: 3600000 });

// User-Agent rotation for better compatibility
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function detectJobSite(url) {
  const hostname = new URL(url).hostname;
  if (hostname.includes("linkedin")) return "linkedin.com";
  if (hostname.includes("indeed")) return "indeed.com";
  if (hostname.includes("welcometothejungle") || hostname.includes("wttj")) return "welcometothejungle.com";
  if (hostname.includes("hellowork")) return "hellowork.com";
  if (hostname.includes("apec")) return "apec.fr";
  if (hostname.includes("pole-emploi") || hostname.includes("francetravail")) return "pole-emploi.fr";
  if (hostname.includes("glassdoor")) return "glassdoor.com";
  if (hostname.includes("monster")) return "monster.fr";
  if (hostname.includes("cadremploi")) return "cadremploi.fr";
  if (hostname.includes("regionsjob")) return "regionsjob.com";
  return hostname;
}

async function fetchJobPage(url, attempt = 1) {
  try {
    const userAgent = getRandomUserAgent();
    const siteType = detectJobSite(url);

    // Site-specific headers
    const headers = {
      "User-Agent": userAgent,
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      "Referer": "https://www.google.com/",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
    };

    // Site-specific adjustments
    if (siteType === "welcometothejungle.com" || siteType === "wttj.co") {
      headers["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
    } else if (siteType === "indeed.com") {
      headers["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
      headers["Cache-Control"] = "no-cache";
    } else {
      headers["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
    }

    const res = await fetch(url, {
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(20000), // Increased timeout for slower sites
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove clutter elements
    $("script, style, nav, footer, header, aside, iframe, noscript").remove();
    const text = $("body").text().replace(/\s+/g, " ").trim();

    // If content is too short and this is the first attempt, retry with different headers
    if (text.length < 200 && attempt === 1) {
      console.log(`Content too short (${text.length} chars), retrying with different headers`);
      return fetchJobPage(url, 2);
    }

    return text.slice(0, 8000);
  } catch (err) {
    console.error(`Scrape error (attempt ${attempt}):`, err.message);
    return null;
  }
}

export async function POST(request) {
  const rl = checkLimit(request);
  const rlResponse = rateLimitResponse(rl);
  if (rlResponse) return rlResponse;

  try {
    const raw = await request.json();
    const jobUrl = sanitizeUrl(raw.jobUrl);
    const experienceLevel = sanitizeString(raw.experienceLevel || "", 50);
    const url = jobUrl;
    if (!url) return Response.json({ error: "URL manquante ou invalide" }, { status: 400 });

    const pageText = await fetchJobPage(url);
    if (!pageText) {
      return Response.json(
        { error: "Impossible d'acceder a cette page. Verifie le lien." },
        { status: 422 }
      );
    }

    // Detect job site using improved detection
    let source = "site";
    try {
      source = detectJobSite(url);
    } catch (err) {
      console.error("Source detection error:", err.message);
    }

    const levelContext = experienceLevel
      ? `\nNiveau d'experience du candidat : ${experienceLevel}. Adapte le niveau d'exigence attendu pour chaque competence en consequence.`
      : "";

    const siteContext = source && source !== "site"
      ? `\nCette offre provient de ${source}. Tiens compte du format specifique de ce site.`
      : "";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Analyse cette offre d'emploi et extrais les informations en JSON strict. Ne retourne QUE le JSON.
${levelContext}${siteContext}

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
