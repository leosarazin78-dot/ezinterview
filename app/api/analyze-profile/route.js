import Anthropic from "@anthropic-ai/sdk";
import { extractJSONObject } from "../../lib/parse-json";
import { createRateLimit, rateLimitResponse } from "../../lib/rate-limit";
import { sanitizeObject } from "../../lib/sanitize";

const anthropic = new Anthropic();

// Rate limit : 15 analyses de profil par heure par IP
const checkLimit = createRateLimit({ key: "analyze-profile", maxRequests: 15, windowMs: 3600000 });

export async function POST(request) {
  const rl = checkLimit(request);
  const rlResponse = rateLimitResponse(rl);
  if (rlResponse) return rlResponse;

  try {
    const raw = await request.json();
    const { jobData, cvText, linkedinUrl, experienceLevel } = sanitizeObject(raw);
    if (!jobData || !cvText)
      return Response.json({ error: "Données manquantes" }, { status: 400 });

    let profileContent = cvText.slice(0, 8000);
    if (linkedinUrl) {
      profileContent += `\n\nProfil LinkedIn : ${linkedinUrl}`;
    }

    const levelLabel = experienceLevel || "non précisé";
    const levelGuidance = {
      "Junior (0-2 ans)": "Ce candidat débute. Valorise les formations, stages, projets personnels et la motivation. Sois encourageant sur les compétences émergentes mais HONNÊTE sur les lacunes.",
      "Confirmé (3-7 ans)": "Ce candidat a de l'expérience. Valorise les réalisations concrètes et la progression. Sois équilibré et constructif.",
      "Senior (8+ ans)": "Ce candidat est expérimenté. Valorise le leadership et l'expertise. Sois exigeant mais juste."
    };

    const guidance = levelGuidance[levelLabel] || "Évalue le profil de manière équilibrée.";

    // Extraire les compétences requises de l'offre
    const requirements = jobData.requirements?.map((r) => r.label) || [];
    const reqList = requirements.length > 0 ? requirements.join(", ") : "voir description de l'offre";
    const jobDescription = jobData.description || jobData.full_description || "";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Tu es un expert RH / recruteur senior. Analyse en PROFONDEUR la compatibilité entre ce CV et cette offre d'emploi.

MÉTHODOLOGIE D'ANALYSE :
1. Lis d'abord INTÉGRALEMENT le CV et l'offre
2. Identifie CHAQUE compétence requise dans l'offre (techniques ET soft skills)
3. Pour chaque compétence, cherche une preuve CONCRÈTE dans le CV (mots-clés, expériences, projets, formations)
4. Évalue le niveau de correspondance basé UNIQUEMENT sur ce qui est écrit

REGLE ABSOLUE : Sois HONNÊTE et PRÉCIS.
- Si une compétence n'apparaît NULLE PART dans le CV → "weak"
- Si le CV mentionne une compétence CONNEXE mais pas exactement celle demandée → "partial"
- Si le CV démontre clairement cette compétence avec expérience → "strong"
- Ne DÉDUIS PAS de compétences non mentionnées. "5 ans d'expérience" ne veut pas dire "maîtrise de tous les outils"
- Analyse les MOTS EXACTS du CV, pas ce que tu imagines

NIVEAU D'EXPÉRIENCE DÉCLARÉ : ${levelLabel}
${guidance}

═══ OFFRE D'EMPLOI ═══
Poste : ${jobData.title} chez ${jobData.company}
Secteur : ${jobData.sector || "non précisé"}
Compétences listées : ${reqList}
${jobDescription ? `Description complète de l'offre :\n${jobDescription.slice(0, 3000)}` : ""}

═══ CV DU CANDIDAT ═══
${profileContent}

═══ FORMAT DE RÉPONSE (JSON strict) ═══
{
  "overallScore": 45,
  "summary": "Résumé HONNÊTE en 3-4 phrases. 1) Points forts réels avec preuves du CV. 2) Lacunes principales avec honnêteté. 3) Note encourageante sur la préparation.",
  "topStrength": "La compétence la plus forte avec citation du CV",
  "stats": {
    "strongCount": 2,
    "partialCount": 3,
    "weakCount": 4,
    "improvementTip": "Conseil précis et actionnable sur LA lacune la plus critique à combler en priorité"
  },
  "matches": [
    {
      "reqId": 1,
      "label": "Nom exact de la compétence requise",
      "match": "strong|partial|weak",
      "profileEvidence": "CITATION EXACTE du CV qui prouve cette compétence, OU 'Non mentionné dans le CV — suggestion pour l'acquérir'"
    }
  ]
}

RÈGLES DE SCORING :
- overallScore = (strong×100 + partial×50) / (total_requirements×100) × 100. Arrondi.
- Exemple : 2 strong + 3 partial + 4 weak sur 9 → (200+150)/900 = 39%
- INCLUS au moins 8-12 compétences dans matches (techniques + soft skills + outils + méthodologies)
- Ne te limite PAS aux "requirements" listés. Analyse TOUTE l'offre pour trouver des compétences implicites.
- profileEvidence DOIT citer un passage réel du CV ou dire explicitement "Non mentionné"

JSON uniquement, pas de texte avant ou après :`,
        },
      ],
    });

    const text = message.content[0].text;
    const parsed = extractJSONObject(text);
    if (!parsed)
      return Response.json(
        { error: "Erreur d'analyse. Réessaie." },
        { status: 500 }
      );

    if (Array.isArray(parsed)) {
      return Response.json({
        overallScore: 40,
        summary: "Analyse terminée. Ton plan de préparation sera adapté à tes lacunes.",
        stats: { strongCount: 0, partialCount: 0, weakCount: 0, topStrength: "", improvementTip: "" },
        matches: parsed,
      });
    }

    return Response.json(parsed);
  } catch (err) {
    console.error("Analyze-profile error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
