import Anthropic from "@anthropic-ai/sdk";
import { extractJSONObject } from "../../lib/parse-json";

const anthropic = new Anthropic();

export async function POST(request) {
  try {
    const { jobData, profile, extras } = await request.json();
    if (!jobData || !profile)
      return Response.json({ error: "Donnees manquantes" }, { status: 400 });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: `Compare ce profil candidat avec cette offre d'emploi. Sois ENCOURAGEANT et CONSTRUCTIF.

OFFRE :
Poste : ${jobData.title} chez ${jobData.company}
Competences requises : ${jobData.requirements?.map((r) => r.label).join(", ")}

PROFIL :
${JSON.stringify(profile)}

${extras ? `Le candidat souhaite aussi travailler sur : ${extras}` : ""}

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
- Sois genereux mais realiste : valorise les experiences connexes, les transferables skills
- Pour chaque match, donne une evidence CONCRETE basee sur le CV
- summary : TOUJOURS positif et motivant, meme si le score est bas
- stats.improvementTip : conseil actionnable et motivant
- "strong" = maitrise directe ou experience significative
- "partial" = bases solides ou experience connexe
- "weak" = peu de couverture mais preparable
- Adapte au domaine du poste
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

    // Compatibilité : si l'ancien format (tableau) est retourné, convertir
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
    console.error("Analyze error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
