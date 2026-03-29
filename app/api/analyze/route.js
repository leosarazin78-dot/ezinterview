import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request) {
  try {
    const { jobData, profile, extras } = await request.json();
    if (!jobData || !profile)
      return Response.json({ error: "Données manquantes" }, { status: 400 });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Compare ce profil candidat avec cette offre d'emploi. Analyse UNIQUEMENT les compétences techniques.

OFFRE :
Poste : ${jobData.title} chez ${jobData.company}
Compétences requises : ${jobData.requirements?.map((r) => r.label).join(", ")}

PROFIL :
${JSON.stringify(profile)}

${extras ? `Le candidat souhaite aussi travailler sur : ${extras}` : ""}

Retourne UNIQUEMENT du JSON strict — un tableau de correspondances :
[
  {
    "reqId": 1,
    "label": "Nom de la compétence requise",
    "match": "strong" | "partial" | "weak",
    "profileEvidence": "Explication courte de pourquoi ce niveau"
  }
]

Évalue chaque requirement de l'offre. "strong" = bien couvert, "partial" = partiellement, "weak" = peu ou pas couvert.`,
        },
      ],
    });

    const text = message.content[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch)
      return Response.json({ error: "Erreur d'analyse" }, { status: 500 });

    return Response.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("Analyze error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}