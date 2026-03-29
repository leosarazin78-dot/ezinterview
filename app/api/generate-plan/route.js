import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request) {
  try {
    const { jobData, matches, priorities, interviewDate, nextInterlocutor, companyInfo } = await request.json();

    if (!priorities?.length || !interviewDate)
      return Response.json({ error: "Données manquantes" }, { status: 400 });

    const daysAvailable = Math.max(1, Math.ceil((new Date(interviewDate) - new Date()) / 86400000));
    const planDays = Math.min(daysAvailable, 14); // Max 14 jours de plan

    const priorityLabels = priorities
      .map((id) => matches?.find((m) => m.reqId === id)?.label)
      .filter(Boolean);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: `Crée un plan de préparation d'entretien technique de ${planDays} jours.

CONTEXTE :
- Poste : ${jobData?.title} chez ${jobData?.company}
- Entretien dans ${daysAvailable} jours${nextInterlocutor ? ` avec ${nextInterlocutor}` : ""}
- Sujets prioritaires : ${priorityLabels.join(", ")}
${companyInfo ? `- Entreprise : secteur ${companyInfo.sector}, concurrents : ${companyInfo.competitors?.join(", ")}` : ""}

RÈGLES :
- ${planDays} jours exactement
- Chaque jour a un focus thématique
- Types d'activités : "note" (lecture), "memo" (cheatsheet/résumé), "video" (vidéo YouTube réelle si possible), "exercise" (lab pratique), "quiz" (quiz de vérification)
- Chaque jour DOIT avoir un quiz en dernière activité
- Inclure au moins 1 jour sur l'entreprise (actualités, concurrents, culture, produits)
- Le dernier jour = révision + quiz final
- Toutes les activités sont TECHNIQUES (pas de soft skills)
- Donner des durées réalistes

Retourne UNIQUEMENT du JSON strict :
[
  {
    "day": 1,
    "title": "Titre du jour",
    "focus": "Mot-clé court du focus",
    "items": [
      {"type": "note|memo|video|exercise|quiz", "title": "Titre descriptif et spécifique", "duration": "XX min"}
    ]
  }
]`,
        },
      ],
    });

    const text = message.content[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch)
      return Response.json({ error: "Erreur de génération" }, { status: 500 });

    return Response.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("Plan generation error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}