import Anthropic from "@anthropic-ai/sdk";
import { extractJSONArray } from "../../lib/parse-json";

const anthropic = new Anthropic();

// URLs de reference fiables et verifiees par domaine
const VERIFIED_SOURCES = `
UTILISE UNIQUEMENT ces URLs racines verifiees (pas de sous-pages inventees) :

COURS & FORMATION :
- https://www.coursera.org — cours universitaires
- https://www.edx.org — cours en ligne
- https://openclassrooms.com — cours FR
- https://www.khanacademy.org — fondamentaux
- https://www.fun-mooc.fr — MOOC francais
- https://ocw.mit.edu — MIT OpenCourseWare

TECH & DEV :
- https://developer.mozilla.org — docs web MDN
- https://react.dev — docs React
- https://docs.python.org — docs Python
- https://nodejs.org/docs — docs Node.js
- https://www.w3schools.com — tutoriels web
- https://leetcode.com — exercices code
- https://exercism.org — exercices code
- https://github.com — repos de reference

FINANCE & BUSINESS :
- https://www.investopedia.com — finance
- https://www.lesechos.fr — actualites eco FR
- https://hbr.org — Harvard Business Review
- https://www.banque-france.fr — Banque de France
- https://www.insee.fr — stats France

DROIT :
- https://www.legifrance.gouv.fr — lois FR
- https://www.service-public.fr — demarches FR
- https://eur-lex.europa.eu — droit europeen
- https://www.dalloz.fr — droit FR

SANTE :
- https://www.who.int — OMS
- https://www.has-sante.fr — HAS France
- https://pubmed.ncbi.nlm.nih.gov — articles medicaux
- https://www.vidal.fr — medicaments

MARKETING :
- https://academy.hubspot.com — marketing
- https://skillshop.withgoogle.com — Google certs
- https://www.statista.com — statistiques

GENERAL :
- https://www.youtube.com — videos educatives
- https://fr.wikipedia.org — definitions
- https://scholar.google.com — articles academiques
`;

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
        const valid = parsed.every(
          (d) => d.day && d.title && Array.isArray(d.items)
        );
        if (valid) return parsed;
      }

      console.warn(
        `Attempt ${attempt + 1}: invalid JSON structure, retrying...`
      );
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

    const prompt = `Tu es un expert en preparation d'entretien. Genere un plan de ${planDays} jours en JSON valide.

CONTEXTE :
- Poste : ${jobData?.title} chez ${company}
- Secteur : ${sector}
- Entretien dans ${daysAvailable} jours${nextInterlocutor ? ` avec ${nextInterlocutor}` : ""}
- Priorites : ${priorityLabels.join(", ")}
${companyInfo?.competitors?.length ? `- Concurrents : ${companyInfo.competitors.join(", ")}` : ""}
${companyInfo?.techStack?.length ? `- Outils : ${companyInfo.techStack.join(", ")}` : ""}

${VERIFIED_SOURCES}

FORMAT JSON — retourne UNIQUEMENT ce tableau :
[
  {
    "day": 1,
    "title": "Titre du jour",
    "focus": "Mot-cle",
    "items": [
      {
        "type": "note",
        "title": "Titre",
        "duration": "20 min",
        "content": {
          "summary": "Resume concret en 3 phrases",
          "keyPoints": ["Point 1", "Point 2", "Point 3"],
          "tips": ["Astuce"],
          "links": [
            {"label": "Nom", "url": "URL de la liste ci-dessus", "type": "article"},
            {"label": "Video", "url": "https://www.youtube.com", "type": "video"}
          ]
        },
        "miniQuiz": [{"q": "Question ?", "options": ["A", "B", "C", "D"], "correct": 0}]
      },
      {
        "type": "exercise",
        "title": "Exercice",
        "duration": "30 min",
        "content": {
          "objective": "Objectif",
          "steps": ["Etape 1", "Etape 2"],
          "tips": ["Conseil"],
          "links": [{"label": "Nom", "url": "URL", "type": "lab"}]
        }
      },
      {
        "type": "quiz",
        "title": "Quiz du jour",
        "duration": "10 min",
        "content": {
          "questions": [
            {"q": "Question ?", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "Pourquoi"}
          ]
        }
      }
    ]
  }
]

REGLES :
1. ${planDays} jours, 3-5 items chacun
2. Chaque jour finit par un quiz (5-8 questions)
3. Les notes ont des miniQuiz (1-2 questions)
4. URLS : utilise UNIQUEMENT les URLs racines de la liste ci-dessus. NE PAS inventer de sous-pages.
5. Adapte au domaine du poste
6. Un jour sur ${company} : produits, actualites, culture
7. Dernier jour = revision + quiz final 10 questions
8. Contenu concret avec vrais exemples
9. JSON COMPLET et VALIDE, pas de troncature
10. Pas de guillemets courbes ni retours a la ligne dans les strings

JSON uniquement :`;

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
