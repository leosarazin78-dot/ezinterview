import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import { extractJSONObject } from "../../lib/parse-json";

const anthropic = new Anthropic();

// Fetch la page de l'offre et extraire le texte
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

    // Supprimer scripts, styles, nav, footer
    $("script, style, nav, footer, header, aside, iframe, noscript").remove();

    // Extraire le texte principal
    const text = $("body").text().replace(/\s+/g, " ").trim();
    return text.slice(0, 8000); // Limiter pour le prompt
  } catch (err) {
    console.error("Scrape error:", err.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) return Response.json({ error: "URL manquante" }, { status: 400 });

    const pageText = await fetchJobPage(url);
    if (!pageText) {
      return Response.json(
        { error: "Impossible d'accéder à cette page. Vérifie le lien." },
        { status: 422 }
      );
    }

    // Déterminer la source
    let source = "site";
    if (url.includes("linkedin")) source = "linkedin.com";
    else if (url.includes("indeed")) source = "indeed.com";
    else if (url.includes("welcometothejungle") || url.includes("wttj"))
      source = "welcometothejungle.com";
    else {
      try {
        source = new URL(url).hostname;
      } catch {}
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Analyse cette offre d'emploi et extrais les informations en JSON strict. Ne retourne QUE le JSON, rien d'autre.

Texte de la page :
${pageText}

Format attendu :
{
  "title": "Titre du poste",
  "company": "Nom de l'entreprise",
  "location": "Lieu",
  "type": "CDI/CDD/Stage/Freelance",
  "salary": "Salaire si mentionné ou null",
  "description": "Description courte du poste (2-3 phrases)",
  "requirements": [
    {"id": 1, "label": "Compétence technique", "category": "tech", "level": "Avancé/Intermédiaire/Basique"}
  ],
  "interviewSteps": [
    {"step": 1, "label": "Nom de l'étape", "interlocutor": "Qui", "duration": "Durée", "type": "visio/sur site/tel/take home"}
  ],
  "companyInfo": {
    "sector": "Secteur d'activité",
    "techStack": ["Tech1", "Tech2"]
  }
}

IMPORTANT :
- requirements : uniquement des compétences TECHNIQUES (pas de soft skills, pas de langues)
- interviewSteps : extrais-les si le processus est décrit dans l'offre, sinon retourne un tableau vide []
- Retourne UNIQUEMENT le JSON valide`,
        },
      ],
    });

    const text = message.content[0].text;
    const jobData = extractJSONObject(text);
    if (!jobData)
      return Response.json({ error: "Erreur d'analyse de l'offre. Réessaie." }, { status: 500 });

    jobData.source = source;
    return Response.json(jobData);
  } catch (err) {
    console.error("API error:", err);
    return Response.json(
      { error: "Erreur serveur : " + err.message },
      { status: 500 }
    );
  }
}