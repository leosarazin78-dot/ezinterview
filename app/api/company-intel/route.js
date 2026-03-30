import Anthropic from "@anthropic-ai/sdk";
import { extractJSONObject } from "../../lib/parse-json";

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
          content: `Donne-moi une fiche intelligence economique sur l'entreprise "${company}" (secteur : ${sector || "non precise"}).

Retourne UNIQUEMENT du JSON strict :
{
  "founded": "Annee de fondation",
  "hq": "Siege social",
  "employees": "Nombre approximatif d'employes",
  "sector": "Secteur d'activite",
  "recentNews": ["Actualite 1 (avec date)", "Actualite 2", "Actualite 3", "Actualite 4"],
  "competitors": ["Concurrent 1", "Concurrent 2", "Concurrent 3", "Concurrent 4", "Concurrent 5"],
  "techStack": ["Outil/methode/techno 1", "Outil/methode/techno 2"],
  "businessModel": "Modele economique en 1 phrase",
  "culture": "Culture d'entreprise en 1-2 phrases (valeurs, ambiance, mode de travail)"
}

IMPORTANT :
- techStack : liste les outils, logiciels, technologies, methodes ou frameworks utilises par l'entreprise. Pour une entreprise tech ce sera des langages/frameworks, pour un cabinet de conseil des methodologies, pour une banque des outils financiers/ERP, etc.
- culture : decris concretement la culture (ex: startup agile, grand groupe hierarchique, cabinet collaboratif...)
- Sois precis et factuel. Pour les actualites, donne les plus recentes que tu connais.`,
        },
      ],
    });

    const text = message.content[0].text;
    const parsed = extractJSONObject(text);
    if (!parsed) return Response.json({ error: "Erreur d'analyse. Réessaie." }, { status: 500 });

    return Response.json(parsed);
  } catch (err) {
    console.error("Company intel error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}