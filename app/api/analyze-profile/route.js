import Anthropic from "@anthropic-ai/sdk";
import { extractJSONObject } from "../../lib/parse-json";

const anthropic = new Anthropic();

export async function POST(request) {
  try {
    const { jobData, cvText, linkedinUrl, experienceLevel } = await request.json();
    if (!jobData || !cvText)
      return Response.json({ error: "Donnees manquantes" }, { status: 400 });

    let profileContent = cvText.slice(0, 6000);
    if (linkedinUrl) {
      profileContent += `\n\nProfil LinkedIn : ${linkedinUrl}`;
    }

    const levelLabel = experienceLevel || "non precise";
    const levelGuidance = {
      "Junior (0-2 ans)": "Ce candidat débute. Valorise les formations, stages, projets personnels et la motivation. Sois particulièrement encourageant sur les compétences émergentes.",
      "Confirmé (3-7 ans)": "Ce candidat a de l'expérience. Valorise les réalisations concrètes, les responsabilités prises et la progression. Sois équilibré et constructif.",
      "Senior (8+ ans)": "Ce candidat est expérimenté. Valorise le leadership, l'expertise approfondie, les contributions stratégiques. Sois exigeant mais juste."
    };

    const guidance = levelGuidance[levelLabel] || "Evalue le profil de maniere equilibree.";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: `Compare ce profil candidat avec cette offre d'emploi. Sois ENCOURAGEANT et CONSTRUCTIF.

NIVEAU D'EXPERIENCE : ${levelLabel}
${guidance}

OFFRE :
Poste : ${jobData.title} chez ${jobData.company}
Competences requises : ${jobData.requirements?.map((r) => r.label).join(", ")}

PROFIL DU CANDIDAT :
${profileContent}

Retourne UNIQUEMENT du JSON strict, un objet avec cette structure :

{
  "overallScore": 72,
  "summary": "Resume encourageant en 2-3 phrases. Souligne les points forts et le potentiel. Ex: Ton profil montre de solides bases en X et Y. Avec une preparation ciblee sur Z, tu as toutes les chances de reussir.",
  "stats": {
    "strongCount": 3,
    "partialCount": 2,
    "weakCount": 1,
    "topStrength": "Nom de la competence la plus forte",
    "improvementTip": "Un conseil motivant et actionnable pour progresser rapidement"
  },
  "matches": [
    {
      "reqId": 1,
      "label": "Nom de la competence requise",
      "match": "strong",
      "profileEvidence": "Explication courte et POSITIVE. Pour strong: valorise l'experience. Pour partial: souligne ce qui est deja acquis et ce qui manque. Pour weak: reste encourageant, indique que c'est faisable a preparer."
    }
  ]
}

REGLES :
- overallScore : score de 0 a 100 representant la compatibilite globale
- Adapte ton evaluation au niveau d'experience : un junior n'a pas besoin de maitriser autant qu'un senior
- Pour un junior, valorise les formations recentes, projets perso, stages, motivation
- Pour un confirme, valorise les realisations concretes et l'experience terrain
- Pour un senior, valorise l'expertise et le leadership
- Sois genereux mais realiste : valorise les experiences connexes, les transferable skills
- Pour chaque match, donne une evidence CONCRETE basee sur le CV
- summary : TOUJOURS positif et motivant, meme si le score est bas
- stats.improvementTip : conseil actionnable et motivant
- "strong" = maitrise directe ou experience significative
- "partial" = bases solides ou experience connexe
- "weak" = peu de couverture mais preparable
- Pas de caracteres speciaux, guillemets courbes ou retours a la ligne dans les strings

Retourne UNIQUEMENT le JSON valide, rien d'autre.`,
        },
      ],
    });

    const text = message.content[0].text;
    const parsed = extractJSONObject(text);
    if (!parsed)
      return Response.json(
        { error: "Erreur d'analyse. Reessaie." },
        { status: 500 }
      );

    // Compatibilite : si l'ancien format (tableau) est retourne, convertir
    if (Array.isArray(parsed)) {
      return Response.json({
        overallScore: 65,
        summary: "Analyse terminee. Selectionne tes priorites pour generer ton plan.",
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
