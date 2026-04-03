import Anthropic from "@anthropic-ai/sdk";
import { extractJSONArray } from "../../lib/parse-json";

const anthropic = new Anthropic();

// Génère le plan avec retry automatique (max 2 tentatives)
async function generateWithRetry(prompt, maxRetries = 2) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      });

      const text = message.content[0].text;
      const parsed = extractJSONArray(text);

      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        // Valider la structure basique
        const valid = parsed.every(
          (d) => d.day && d.title && Array.isArray(d.items)
        );
        if (valid) return parsed;
      }

      console.warn(`Attempt ${attempt + 1}: invalid JSON structure, retrying...`);
    } catch (err) {
      console.error(`Attempt ${attempt + 1} error:`, err.message);
      if (attempt === maxRetries - 1) throw err;
    }
  }
  return null;
}

export async function POST(request) {
  try {
    const {
      jobData,
      matches,
      priorities,
      interviewDate,
      nextInterlocutor,
      companyInfo,
    } = await request.json();

    if (!priorities?.length || !interviewDate)
      return Response.json({ error: "Donnees manquantes" }, { status: 400 });

    const daysAvailable = Math.max(
      1,
      Math.ceil((new Date(interviewDate) - new Date()) / 86400000)
    );
    const planDays = Math.min(daysAvailable, 14);

    const priorityLabels = priorities
      .map(
        (id) =>
          matches?.find((m) => m.reqId === id || m.reqId === String(id))?.label
      )
      .filter(Boolean);

    const sector =
      companyInfo?.sector || jobData?.companyInfo?.sector || "non precise";
    const company = jobData?.company || "l'entreprise";

    const prompt = `Tu es un expert en preparation d'entretien professionnel. Genere un plan de ${planDays} jours en JSON.

CONTEXTE :
- Poste : ${jobData?.title} chez ${company}
- Secteur : ${sector}
- Entretien dans ${daysAvailable} jours${nextInterlocutor ? ` avec ${nextInterlocutor}` : ""}
- Priorites : ${priorityLabels.join(", ")}
${companyInfo?.competitors?.length ? `- Concurrents : ${companyInfo.competitors.join(", ")}` : ""}
${companyInfo?.techStack?.length ? `- Outils : ${companyInfo.techStack.join(", ")}` : ""}

FORMAT JSON STRICT — retourne UNIQUEMENT un tableau JSON valide, rien d'autre :

[
  {
    "day": 1,
    "title": "Titre du jour",
    "focus": "Mot-cle court",
    "items": [
      {
        "type": "note",
        "title": "Titre clair",
        "duration": "20 min",
        "content": {
          "summary": "Resume en 3 phrases",
          "keyPoints": ["Point 1", "Point 2", "Point 3"],
          "tips": ["Astuce 1"],
          "links": [
            {"label": "Nom ressource", "url": "https://domaine-connu.com/page", "type": "article"},
            {"label": "Video", "url": "https://youtube.com/watch?v=...", "type": "video"}
          ]
        },
        "miniQuiz": [{"q": "Question ?", "options": ["A", "B", "C", "D"], "correct": 0}]
      },
      {
        "type": "exercise",
        "title": "Exercice pratique",
        "duration": "30 min",
        "content": {
          "objective": "Ce que ca permet de pratiquer",
          "steps": ["Etape 1", "Etape 2"],
          "tips": ["Conseil"],
          "links": [{"label": "Ressource", "url": "https://...", "type": "lab"}]
        }
      },
      {
        "type": "quiz",
        "title": "Quiz du jour",
        "duration": "10 min",
        "content": {
          "questions": [
            {"q": "Question ?", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "Explication"}
          ]
        }
      }
    ]
  }
]

REGLES :
1. Exactement ${planDays} jours, chacun avec 3-5 items
2. Chaque jour finit par un quiz de 5-8 questions
3. Les "note" ont des miniQuiz de 1-2 questions
4. Chaque note a 2-3 liens de sources REELLES et DIFFERENTES (pas d'URLs inventees)
5. Adapte au domaine : tech=code/system design, finance=cas/modelisation, droit=jurisprudence, marketing=KPIs/campagnes, sante=protocoles, etc.
6. Un jour complet sur ${company} : produits, actualites, concurrents, culture
7. Dernier jour = revision + quiz final de 10 questions
8. Contenu CONCRET : vrais points cles, definitions, exemples
9. Sources de reference : docs officielles, Coursera, YouTube educatif, Legifrance, Investopedia, MDN, PubMed selon le domaine
10. Les URLs doivent utiliser des domaines connus (coursera.org, youtube.com, developer.mozilla.org, legifrance.gouv.fr, etc.)
11. Pas de caracteres speciaux dans les strings JSON (pas de guillemets courbes, pas de retours a la ligne)
12. IMPORTANT : le JSON doit etre COMPLET et VALIDE. Ne pas tronquer.

Retourne UNIQUEMENT le tableau JSON, sans aucun texte avant ou apres.`;

    const parsed = await generateWithRetry(prompt);

    if (!parsed) {
      return Response.json(
        {
          error:
            "Impossible de generer le plan. Reessaie ou reduis le nombre de jours.",
        },
        { status: 500 }
      );
    }

    return Response.json(parsed);
  } catch (err) {
    console.error("Plan generation error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
