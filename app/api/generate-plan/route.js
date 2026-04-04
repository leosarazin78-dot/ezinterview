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
- https://www.fun-mooc.fr — MOOC francais
- https://www.khanacademy.org — fondamentaux
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

ARCHITECTURE & BTP :
- https://www.architectes.org — Ordre des architectes FR
- https://www.batiactu.com — actualites BTP
- https://www.legifrance.gouv.fr — reglementations construction

EDUCATION :
- https://eduscol.education.fr — ressources pedagogiques FR
- https://www.education.gouv.fr — Education nationale
- https://www.reseau-canope.fr — ressources enseignants

ARTISANAT & METIERS MANUELS :
- https://www.artisanat.fr — Chambre des Metiers
- https://www.compagnons-du-devoir.com — formation compagnons

GENERAL :
- https://www.youtube.com — videos educatives
- https://fr.wikipedia.org — definitions
- https://scholar.google.com — articles academiques
`;

// Configuration d'intensite
const INTENSITY_CONFIG = {
  "Léger": {
    dailyTime: "30 min",
    itemsPerDay: "2-3",
    quizQuestions: "3-5",
    description: "plan léger adapté à un emploi du temps chargé"
  },
  "Standard": {
    dailyTime: "1h",
    itemsPerDay: "3-5",
    quizQuestions: "5-8",
    description: "plan équilibré entre effort et efficacité"
  },
  "Intensif": {
    dailyTime: "2h+",
    itemsPerDay: "5-7",
    quizQuestions: "8-10",
    description: "plan intensif pour une préparation en profondeur"
  }
};

// Configuration niveau d'experience
const LEVEL_CONFIG = {
  "Junior (0-2 ans)": {
    resourceLevel: "débutant/intermédiaire",
    focus: "Privilégie les tutoriels pas-à-pas, cours d'introduction, exercices guidés. Explique les concepts de base. Recommande des formations structurées (Coursera, OpenClassrooms, edX).",
    quizDifficulty: "Questions de compréhension et de définition, pas de pièges."
  },
  "Confirmé (3-7 ans)": {
    resourceLevel: "intermédiaire/avancé",
    focus: "Privilégie les études de cas, articles approfondis, exercices pratiques réalistes. Moins d'explications basiques, plus de mise en situation.",
    quizDifficulty: "Questions de mise en situation et d'analyse, quelques questions avancées."
  },
  "Senior (8+ ans)": {
    resourceLevel: "avancé/expert",
    focus: "Privilégie les articles de fond (HBR, publications spécialisées), cas complexes, vision stratégique. Focus sur le leadership, la prise de décision, les tendances du secteur.",
    quizDifficulty: "Questions stratégiques, de jugement et de leadership. Pas de questions basiques."
  }
};

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
      stats,
      intensity,
      experienceLevel,
    } = await request.json();

    if (!jobData)
      return Response.json({ error: "Donnees manquantes" }, { status: 400 });

    // Determiner le nombre de jours (7 par defaut, adapte a l'intensite)
    const intensityKey = intensity || "Standard";
    const ic = INTENSITY_CONFIG[intensityKey] || INTENSITY_CONFIG["Standard"];
    const planDays = intensityKey === "Léger" ? 10 : intensityKey === "Intensif" ? 5 : 7;

    // Extraire les competences a travailler depuis stats
    const matches = stats?.matches || [];
    const weakAndPartial = matches
      .filter((m) => m.match === "weak" || m.match === "partial")
      .map((m) => m.label);
    const strong = matches
      .filter((m) => m.match === "strong")
      .map((m) => m.label);
    const allSkills = matches.map((m) => m.label);

    const levelKey = experienceLevel || "Confirmé (3-7 ans)";
    const lc = LEVEL_CONFIG[levelKey] || LEVEL_CONFIG["Confirmé (3-7 ans)"];

    const sector = jobData?.companyInfo?.sector || "non precise";
    const company = jobData?.company || "l'entreprise";

    const prompt = `Tu es un expert en preparation d'entretien. Genere un plan de ${planDays} jours en JSON valide.

CONTEXTE :
- Poste : ${jobData?.title} chez ${company}
- Secteur : ${sector}
- Intensite : ${ic.description} (${ic.dailyTime} par jour)
- Niveau d'experience : ${levelKey}
- Competences a renforcer : ${weakAndPartial.length > 0 ? weakAndPartial.join(", ") : "aucune faiblesse identifiee"}
- Points forts a consolider : ${strong.length > 0 ? strong.join(", ") : "a evaluer"}
- Toutes les competences requises : ${allSkills.join(", ")}
${jobData?.companyInfo?.competitors?.length ? `- Concurrents : ${jobData.companyInfo.competitors.join(", ")}` : ""}
${jobData?.companyInfo?.techStack?.length ? `- Outils du poste : ${jobData.companyInfo.techStack.join(", ")}` : ""}

ADAPTATION AU NIVEAU (${levelKey}) :
${lc.focus}
Niveau des ressources : ${lc.resourceLevel}
Quiz : ${lc.quizDifficulty}

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
1. ${planDays} jours, ${ic.itemsPerDay} items chacun
2. Chaque jour finit par un quiz (${ic.quizQuestions} questions)
3. Les notes ont des miniQuiz (1-2 questions)
4. URLS : utilise UNIQUEMENT les URLs racines de la liste ci-dessus. NE PAS inventer de sous-pages.
5. Adapte au domaine du poste (${sector}). Exemples de domaines : developpeur, architecte, juriste, comptable, marketeur, enseignant, artisan, medecin, commercial, RH, data analyst, designer, chef de projet...
6. Un jour sur ${company} : produits, actualites, culture
7. Dernier jour = revision + quiz final 10 questions
8. Contenu concret avec vrais exemples adaptes au secteur
9. JSON COMPLET et VALIDE, pas de troncature
10. Pas de guillemets courbes ni retours a la ligne dans les strings
11. Concentre les premiers jours sur les competences faibles/partielles, les derniers jours sur la consolidation des points forts
12. Adapte la difficulte au niveau ${levelKey} : ${lc.quizDifficulty}

JSON uniquement :`;

    const parsed = await generateWithRetry(prompt);

    if (!parsed) {
      return Response.json(
        {
          error:
            "Impossible de generer le plan. Reessaie.",
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
