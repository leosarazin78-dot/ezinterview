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

    let profileContent = cvText.slice(0, 6000);
    if (linkedinUrl) {
      profileContent += `\n\nProfil LinkedIn : ${linkedinUrl}`;
    }

    const levelLabel = experienceLevel || "non précisé";
    const levelGuidance = {
      "Junior (0-2 ans)": "Ce candidat débute. Valorise les formations, stages, projets personnels et la motivation. Sois particulièrement encourageant sur les compétences émergentes.",
      "Confirmé (3-7 ans)": "Ce candidat a de l'expérience. Valorise les réalisations concrètes, les responsabilités prises et la progression. Sois équilibré et constructif.",
      "Senior (8+ ans)": "Ce candidat est expérimenté. Valorise le leadership, l'expertise approfondie, les contributions stratégiques. Sois exigeant mais juste."
    };

    const guidance = levelGuidance[levelLabel] || "Évalue le profil de manière équilibrée.";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: `Compare ce profil candidat avec cette offre d'emploi.

REGLE ABSOLUE : Sois HONNÊTE et PRÉCIS. NE MENS PAS sur les compétences du candidat.
- Si une compétence n'apparaît NULLE PART dans le CV, elle est "weak". Point final.
- N'invente JAMAIS d'expérience que le CV ne mentionne pas.
- Si le CV ne mentionne pas du tout React, ne dis pas "partial" — c'est "weak".
- Si le CV mentionne JavaScript mais pas React spécifiquement, c'est "partial" pour React (expérience connexe).
- Mieux vaut dire honnêtement "tu n'as pas cette compétence, mais tu peux l'acquérir" que mentir.
- C'est OK d'avoir beaucoup de "weak" — l'objectif est de BIEN PRÉPARER, pas de flatter.

NIVEAU D'EXPÉRIENCE : ${levelLabel}
${guidance}

OFFRE :
Poste : ${jobData.title} chez ${jobData.company}
Compétences requises : ${jobData.requirements?.map((r) => r.label).join(", ")}

PROFIL DU CANDIDAT :
${profileContent}

Retourne UNIQUEMENT du JSON strict :

{
  "overallScore": 45,
  "summary": "Résumé HONNÊTE en 2-3 phrases. Commence par les vrais points forts, puis indique clairement les lacunes. Termine par une note encourageante sur la préparation possible. Exemple : Tu as de solides bases en X. En revanche, Y et Z ne figurent pas dans ton parcours actuel. La bonne nouvelle : ces compétences s'acquièrent avec une préparation ciblée.",
  "stats": {
    "strongCount": 1,
    "partialCount": 2,
    "weakCount": 4,
    "topStrength": "La compétence la plus forte du candidat (ou vide si aucune)",
    "improvementTip": "Conseil concret et actionnable pour la lacune la plus critique"
  },
  "matches": [
    {
      "reqId": 1,
      "label": "Nom de la compétence requise",
      "match": "strong",
      "profileEvidence": "Pour strong : cite la preuve EXACTE du CV. Pour partial : explique ce qui est acquis et ce qui manque. Pour weak : dis clairement que ce n'est pas dans le CV, et donne une piste pour l'apprendre."
    }
  ]
}

RÈGLES DE CLASSEMENT :
- "strong" = le CV mentionne EXPLICITEMENT cette compétence avec de l'expérience concrète
- "partial" = le CV mentionne une compétence CONNEXE ou un domaine proche (ex: JavaScript → TypeScript est partial)
- "weak" = RIEN dans le CV ne couvre cette compétence, même de loin. C'est le classement par défaut si tu n'es pas sûr.

RÈGLES GÉNÉRALES :
- overallScore : reflète VRAIMENT la couverture. 3 strong sur 8 requirements = ~35-40%, pas 70%
- Ne gonfle PAS le score pour faire plaisir. Un score bas + un bon plan = meilleur résultat qu'un faux score élevé
- Pour chaque match, la profileEvidence doit citer un élément RÉEL du CV ou dire clairement "Non mentionné dans votre CV"
- summary : TOUJOURS encourageant sur la possibilité de progresser, mais HONNÊTE sur l'état actuel
- Pas de caractères spéciaux, guillemets courbes ou retours à la ligne dans les strings

Retourne UNIQUEMENT le JSON valide, rien d'autre.`,
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
