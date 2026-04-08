import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import { extractJSONObject } from "../../lib/parse-json";
import { createRateLimit, rateLimitResponse } from "../../lib/rate-limit";
import { sanitizeUrl, sanitizeString } from "../../lib/sanitize";
import { analyzeJobServerSchema } from "../../lib/validation";

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

// Extraire les données structurées JSON-LD d'une page (schema.org JobPosting)
function extractJsonLd(html) {
  try {
    const $ = cheerio.load(html);
    const scripts = $('script[type="application/ld+json"]');
    let jobData = null;
    scripts.each((_, el) => {
      try {
        const data = JSON.parse($(el).html());
        // Peut être un tableau ou un objet
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item["@type"] === "JobPosting" || item["@type"]?.includes("JobPosting")) {
            jobData = item;
            break;
          }
          // Parfois imbriqué dans @graph
          if (item["@graph"]) {
            const job = item["@graph"].find(g => g["@type"] === "JobPosting");
            if (job) { jobData = job; break; }
          }
        }
      } catch {}
    });
    if (!jobData) return null;
    // Convertir en texte lisible pour l'IA
    const parts = [];
    if (jobData.title) parts.push(`Titre: ${jobData.title}`);
    if (jobData.hiringOrganization?.name) parts.push(`Entreprise: ${jobData.hiringOrganization.name}`);
    if (jobData.jobLocation?.address) {
      const addr = jobData.jobLocation.address;
      parts.push(`Lieu: ${addr.addressLocality || ""} ${addr.addressCountry || ""}`);
    }
    if (jobData.description) parts.push(`Description: ${jobData.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()}`);
    if (jobData.qualifications) parts.push(`Qualifications: ${jobData.qualifications}`);
    if (jobData.skills) parts.push(`Compétences: ${jobData.skills}`);
    if (jobData.employmentType) parts.push(`Type: ${jobData.employmentType}`);
    if (jobData.baseSalary) parts.push(`Salaire: ${JSON.stringify(jobData.baseSalary)}`);
    return parts.join("\n").slice(0, 8000);
  } catch {
    return null;
  }
}

// Extraire les meta tags Open Graph et description
function extractMetaTags(html) {
  try {
    const $ = cheerio.load(html);
    const parts = [];
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const ogDesc = $('meta[property="og:description"]').attr("content");
    const metaDesc = $('meta[name="description"]').attr("content");
    const title = $("title").text();
    if (ogTitle) parts.push(`Titre: ${ogTitle}`);
    else if (title) parts.push(`Titre: ${title}`);
    if (ogDesc) parts.push(`Description: ${ogDesc}`);
    else if (metaDesc) parts.push(`Description: ${metaDesc}`);
    return parts.length > 0 ? parts.join("\n") : null;
  } catch {
    return null;
  }
}

async function fetchJobPage(url, attempt = 1) {
  try {
    const userAgent = getRandomUserAgent();

    const headers = {
      "User-Agent": userAgent,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      "Referer": "https://www.google.com/",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "no-cache",
    };

    const res = await fetch(url, {
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // 1. Essayer JSON-LD en priorité (données structurées = meilleure qualité)
    const jsonLdText = extractJsonLd(html);
    if (jsonLdText && jsonLdText.length > 200) {
      console.log("Extracted job data from JSON-LD structured data");
      return jsonLdText;
    }

    // 2. Essayer le body text nettoyé
    const $ = cheerio.load(html);
    $("script, style, nav, footer, header, aside, iframe, noscript").remove();
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();

    if (bodyText.length >= 200) {
      return bodyText.slice(0, 8000);
    }

    // 3. Fallback meta tags si body trop court
    const metaText = extractMetaTags(html);
    if (metaText) {
      console.log("Fallback to meta tags extraction");
      // Combiner meta + body court
      return `${metaText}\n\nContenu de la page:\n${bodyText}`.slice(0, 8000);
    }

    // 4. Retry avec headers différents
    if (attempt === 1) {
      console.log(`Content too short (${bodyText.length} chars), retrying`);
      return fetchJobPage(url, 2);
    }

    // 5. Retourner ce qu'on a même si c'est court
    return bodyText.length > 50 ? bodyText.slice(0, 8000) : null;
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

    let validated;
    try {
      validated = analyzeJobServerSchema.parse(raw);
    } catch (err) {
      return Response.json({ error: "Données invalides", details: err.errors?.map(e => e.message) }, { status: 400 });
    }

    const jobUrl = sanitizeUrl(validated.jobUrl);
    const jobText = sanitizeString(validated.jobText || "", 10000);
    const experienceLevel = sanitizeString(validated.experienceLevel || "", 50);

    // Mode texte collé (fallback quand scraping échoue)
    let pageText = null;
    let source = "site";
    let url = jobUrl;

    if (jobText && jobText.length > 50) {
      // L'utilisateur a collé le texte directement
      pageText = jobText.slice(0, 8000);
      source = "texte collé";
    } else if (url) {
      pageText = await fetchJobPage(url);
      if (!pageText) {
        return Response.json(
          { error: "Impossible d'accéder à cette page. Essaie de coller le texte de l'offre directement." },
          { status: 422 }
        );
      }
      try {
        source = detectJobSite(url);
      } catch (err) {
        console.error("Source detection error:", err.message);
      }
    } else {
      return Response.json({ error: "URL ou texte de l'offre requis" }, { status: 400 });
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
