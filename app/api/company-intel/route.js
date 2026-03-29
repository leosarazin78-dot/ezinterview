import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function POST(request) {
  try {
    const { company, sector } = await request.json();
    if (!company) return Response.json({ error: "Nom d'entreprise manquant" }, { status: 400 });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `Donne-moi une fiche intelligence économique sur l'entreprise "${company}" (secteur : ${sector || "non précisé"}).

Retourne UNIQUEMENT du JSON strict :
{
  "founded": "Année de fondation",
  "hq": "Siège social",
  "employees": "Nombre approximatif d'employés",
  "sector": "Secteur d'activité",
  "recentNews": ["Actualité 1 (avec date)", "Actualité 2", "Actualité 3", "Actualité 4"],
  "competitors": ["Concurrent 1", "Concurrent 2", "Concurrent 3", "Concurrent 4", "Concurrent 5"],
  "techStack": ["Tech 1", "Tech 2"],
  "businessModel": "Modèle économique en 1 phrase",
  "culture": "Culture d'entreprise en 1-2 phrases"
}

Sois précis et factuel. Pour les actualités, donne les plus récentes que tu connais.`,
        },
      ],
    });

    const text = message.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return Response.json({ error: "Erreur d'analyse" }, { status: 500 });

    return Response.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("Company intel error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}