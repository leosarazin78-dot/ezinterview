import Anthropic from "@anthropic-ai/sdk";
import { extractJSONArray } from "../../lib/parse-json";

const anthropic = new Anthropic();

// Instructions pour les liens et le contenu du plan
const SOURCES_INSTRUCTIONS = `
RÈGLES POUR LES LIENS ET LE CONTENU :

1. CONTENU AUTONOME : Chaque note doit être suffisamment détaillée pour que l'utilisateur puisse apprendre SANS cliquer sur les liens. Le summary doit faire 5-8 phrases, les keyPoints doivent être des explications complètes (pas juste des titres). Les liens sont un COMPLÉMENT, pas le contenu principal.

2. LIENS SPÉCIFIQUES : Utilise des URLs qui pointent vers des pages PRÉCISES, pas des pages d'accueil.

EXEMPLES DE BONS LIENS (spécifiques) :
- https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Statements/async_function
- https://react.dev/learn/state-a-components-memory
- https://docs.python.org/3/tutorial/datastructures.html
- https://www.coursera.org/learn/machine-learning
- https://openclassrooms.com/fr/courses/7150606-creez-une-application-react-complete
- https://www.w3schools.com/js/js_async.asp
- https://www.investopedia.com/terms/d/dcf.asp
- https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006900847
- https://leetcode.com/problems/two-sum/
- https://exercism.org/tracks/javascript/exercises/hello-world
- https://academy.hubspot.com/courses/inbound-marketing
- https://www.youtube.com/watch?v=dQw4w9WgXcQ (un VRAI ID vidéo)

EXEMPLES DE MAUVAIS LIENS (trop génériques) :
- https://www.youtube.com (page d'accueil)
- https://www.coursera.org (page d'accueil)
- https://github.com (page d'accueil)

3. DOMAINES AUTORISÉS pour les liens :
coursera.org, edx.org, openclassrooms.com, fun-mooc.fr, khanacademy.org, ocw.mit.edu,
developer.mozilla.org, react.dev, docs.python.org, nodejs.org, w3schools.com, leetcode.com, exercism.org, github.com,
investopedia.com, lesechos.fr, hbr.org, banque-france.fr, insee.fr,
legifrance.gouv.fr, service-public.fr, eur-lex.europa.eu, dalloz.fr,
who.int, has-sante.fr, pubmed.ncbi.nlm.nih.gov, vidal.fr,
academy.hubspot.com, skillshop.withgoogle.com, statista.com,
architectes.org, batiactu.com, eduscol.education.fr, education.gouv.fr, reseau-canope.fr,
artisanat.fr, compagnons-du-devoir.com, youtube.com, fr.wikipedia.org, scholar.google.com

4. Pour YouTube : utilise de VRAIS identifiants de vidéos que tu connais. Si tu n'es pas sûr qu'une vidéo existe, ne mets PAS de lien YouTube. Mieux vaut pas de lien qu'un lien mort.

5. Si tu ne connais pas d'URL spécifique pour un sujet, NE METS PAS de lien. Mets plus de contenu dans le summary et les keyPoints à la place.
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

// Triple validation : structure JSON + cohérence contenu + URLs valides
function validatePlanDeep(parsed) {
  if (!Array.isArray(parsed) || parsed.length === 0) return { ok: false, reason: "not an array" };

  for (const day of parsed) {
    if (!day.day || !day.title || !Array.isArray(day.items) || day.items.length === 0) {
      return { ok: false, reason: `day ${day.day}: missing day/title/items` };
    }
    for (const item of day.items) {
      if (!item.title || !item.type) {
        return { ok: false, reason: `day ${day.day}: item missing title or type` };
      }
      // Vérifier que les liens utilisent les domaines autorisés et ne sont pas des pages d'accueil
      const links = item.content?.links || [];
      for (const link of links) {
        if (!link.url) continue;
        const domainOk = VERIFIED_DOMAINS.some(d => link.url.includes(d));
        if (!domainOk) {
          return { ok: false, reason: `day ${day.day}: URL non vérifiée: ${link.url}` };
        }
        // Rejeter les liens trop génériques (page d'accueil sans path)
        try {
          const u = new URL(link.url);
          if (u.pathname === "/" && !u.search && !u.hash) {
            return { ok: false, reason: `day ${day.day}: URL trop générique (page d'accueil): ${link.url}` };
          }
        } catch {}
      }
    }
  }
  return { ok: true };
}

// Liste des domaines autorisés pour validation des URLs
const VERIFIED_DOMAINS = [
  "coursera.org", "edx.org", "openclassrooms.com", "fun-mooc.fr", "khanacademy.org", "ocw.mit.edu",
  "developer.mozilla.org", "react.dev", "docs.python.org", "nodejs.org", "w3schools.com", "leetcode.com", "exercism.org", "github.com",
  "investopedia.com", "lesechos.fr", "hbr.org", "banque-france.fr", "insee.fr",
  "legifrance.gouv.fr", "service-public.fr", "eur-lex.europa.eu", "dalloz.fr",
  "who.int", "has-sante.fr", "pubmed.ncbi.nlm.nih.gov", "vidal.fr",
  "academy.hubspot.com", "skillshop.withgoogle.com", "statista.com",
  "architectes.org", "batiactu.com",
  "eduscol.education.fr", "education.gouv.fr", "reseau-canope.fr",
  "artisanat.fr", "compagnons-du-devoir.com",
  "youtube.com", "fr.wikipedia.org", "scholar.google.com",
];

async function generateWithRetry(prompt, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Tentative ${attempt + 1}/${maxRetries} de génération du plan...`);
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }],
      });

      const text = message.content[0].text;
      const parsed = extractJSONArray(text);

      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        // Triple check : structure + contenu + URLs
        const validation = validatePlanDeep(parsed);
        if (validation.ok) {
          console.log(`Plan validé à la tentative ${attempt + 1}`);
          return parsed;
        }
        console.warn(`Tentative ${attempt + 1}: validation échouée — ${validation.reason}`);
      } else {
        console.warn(`Tentative ${attempt + 1}: JSON invalide, nouvelle tentative...`);
      }
    } catch (err) {
      console.error(`Tentative ${attempt + 1} erreur:`, err.message);
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

${SOURCES_INSTRUCTIONS}

FORMAT JSON — retourne UNIQUEMENT ce tableau :
[
  {
    "day": 1,
    "title": "Titre du jour",
    "focus": "Mot-cle",
    "items": [
      {
        "type": "note",
        "title": "Titre précis de la leçon",
        "duration": "20 min",
        "content": {
          "summary": "Explication DÉTAILLÉE en 5-8 phrases. L'utilisateur doit pouvoir apprendre le sujet rien qu'en lisant ce texte. Donne des exemples concrets, des définitions, des cas d'usage. Ne dis pas juste 'React utilise des hooks' — explique COMMENT et POURQUOI avec un mini-exemple.",
          "keyPoints": ["Point détaillé avec explication complète, pas juste un titre", "Deuxième point avec contexte et exemple", "Troisième point actionnable"],
          "tips": ["Astuce concrète et applicable immédiatement"],
          "links": [
            {"label": "Nom descriptif du cours/article", "url": "URL SPÉCIFIQUE vers la page du cours (pas la page d'accueil)", "type": "article"}
          ]
        },
        "miniQuiz": [{"q": "Question ?", "options": ["A", "B", "C", "D"], "correct": 0}]
      },
      {
        "type": "exercise",
        "title": "Exercice pratique",
        "duration": "30 min",
        "content": {
          "objective": "Objectif précis et mesurable",
          "steps": ["Étape détaillée avec instructions claires", "Deuxième étape avec critères de réussite"],
          "tips": ["Conseil pratique"],
          "links": [{"label": "Nom", "url": "URL spécifique", "type": "lab"}]
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
