import Anthropic from "@anthropic-ai/sdk";
import { extractJSONArray } from "../../lib/parse-json";
import { createRateLimit, rateLimitResponse } from "../../lib/rate-limit";
import { sanitizeObject, sanitizeUrl } from "../../lib/sanitize";

// Augmenter le timeout Next.js (300s = 5 min)
export const maxDuration = 300;

const anthropic = new Anthropic();

// Rate limit : 5 plans par heure par IP (appel coûteux)
const checkLimit = createRateLimit({ key: "generate-plan", maxRequests: 5, windowMs: 3600000 });

const SOURCES_INSTRUCTIONS = `
RÈGLES POUR LES LIENS ET LE CONTENU :

1. CONTENU AUTONOME : Chaque note doit être suffisamment détaillée pour que l'utilisateur puisse apprendre SANS cliquer sur les liens. Le summary doit faire 5-8 phrases, les keyPoints doivent être des explications complètes (pas juste des titres). Les liens sont un COMPLÉMENT, pas le contenu principal.

2. LIENS SPÉCIFIQUES : Utilise des URLs qui pointent vers des pages PRÉCISES, pas des pages d'accueil.

3. LIENS YOUTUBE : Inclus 1-2 liens YouTube pertinents par jour quand possible. Les vidéos aident à la compréhension. Utilise des identifiants de vidéos que tu connais vraiment.

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

4. DOMAINES AUTORISÉS pour les liens :
coursera.org, edx.org, openclassrooms.com, fun-mooc.fr, khanacademy.org, ocw.mit.edu,
developer.mozilla.org, react.dev, docs.python.org, nodejs.org, w3schools.com, leetcode.com, exercism.org, github.com,
investopedia.com, lesechos.fr, hbr.org, banque-france.fr, insee.fr,
legifrance.gouv.fr, service-public.fr, eur-lex.europa.eu, dalloz.fr,
who.int, has-sante.fr, pubmed.ncbi.nlm.nih.gov, vidal.fr,
academy.hubspot.com, skillshop.withgoogle.com, statista.com,
architectes.org, batiactu.com, eduscol.education.fr, education.gouv.fr, reseau-canope.fr,
artisanat.fr, compagnons-du-devoir.com, youtube.com, fr.wikipedia.org, scholar.google.com

5. Pour YouTube : utilise de VRAIS identifiants de vidéos que tu connais. Si tu n'es pas sûr qu'une vidéo existe, ne mets PAS de lien YouTube. Mieux vaut pas de lien qu'un lien mort.

6. Si tu ne connais pas d'URL spécifique pour un sujet, NE METS PAS de lien. Mets plus de contenu dans le summary et les keyPoints à la place.
`;

const INTENSITY_CONFIG = {
  "Léger": { dailyTime: "30 min", itemsPerDay: "2-3", quizQuestions: "3-5", description: "plan léger adapté à un emploi du temps chargé" },
  "Standard": { dailyTime: "1h", itemsPerDay: "3-5", quizQuestions: "5-8", description: "plan équilibré entre effort et efficacité" },
  "Intensif": { dailyTime: "2h+", itemsPerDay: "5-7", quizQuestions: "8-10", description: "plan intensif pour une préparation en profondeur" },
};

const LEVEL_CONFIG = {
  "Junior (0-2 ans)": {
    resourceLevel: "débutant/intermédiaire",
    focus: "Privilégie les tutoriels pas-à-pas, cours d'introduction, exercices guidés. Explique les concepts de base. Recommande des formations structurées (Coursera, OpenClassrooms, edX).",
    quizDifficulty: "Questions de compréhension et de définition, pas de pièges.",
  },
  "Confirmé (3-7 ans)": {
    resourceLevel: "intermédiaire/avancé",
    focus: "Privilégie les études de cas, articles approfondis, exercices pratiques réalistes. Moins d'explications basiques, plus de mise en situation.",
    quizDifficulty: "Questions de mise en situation et d'analyse, quelques questions avancées.",
  },
  "Senior (8+ ans)": {
    resourceLevel: "avancé/expert",
    focus: "Privilégie les articles de fond (HBR, publications spécialisées), cas complexes, vision stratégique. Focus sur le leadership, la prise de décision, les tendances du secteur.",
    quizDifficulty: "Questions stratégiques, de jugement et de leadership. Pas de questions basiques.",
  },
};

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
      const links = item.content?.links || [];
      for (const link of links) {
        if (!link.url) continue;
        const domainOk = VERIFIED_DOMAINS.some((d) => link.url.includes(d));
        if (!domainOk) {
          // Au lieu de rejeter, on supprime le lien invalide silencieusement
          link._invalid = true;
          continue;
        }
        try {
          const u = new URL(link.url);
          if (u.pathname === "/" && !u.search && !u.hash) {
            link._invalid = true;
          }
        } catch {
          link._invalid = true;
        }
      }
      // Nettoyer les liens invalides plutôt que rejeter tout le plan
      if (item.content?.links) {
        item.content.links = item.content.links.filter((l) => !l._invalid);
      }
    }
  }
  return { ok: true };
}

// Nettoie le plan et retourne null si la structure est invalide
function cleanAndValidate(text) {
  const parsed = extractJSONArray(text);
  if (!parsed || !Array.isArray(parsed) || parsed.length === 0) return null;

  const validation = validatePlanDeep(parsed);
  if (!validation.ok) return null;

  return parsed;
}

export async function POST(request) {
  // Rate limiting
  const rl = checkLimit(request);
  const rlResponse = rateLimitResponse(rl);
  if (rlResponse) return rlResponse;

  try {
    const raw = await request.json();
    // Sanitize tous les inputs
    const { jobData, stats, intensity, experienceLevel, interviewerRole, interviewDate, daysUntilInterview } = sanitizeObject(raw);

    if (!jobData) return Response.json({ error: "Données manquantes" }, { status: 400 });

    const intensityKey = intensity || "Standard";
    const ic = INTENSITY_CONFIG[intensityKey] || INTENSITY_CONFIG["Standard"];
    // Priorité à daysUntilInterview si fourni (max 10 jours)
    let planDays;
    if (daysUntilInterview && daysUntilInterview > 0) {
      planDays = Math.min(daysUntilInterview, 10);
    } else {
      planDays = intensityKey === "Léger" ? 10 : intensityKey === "Intensif" ? 5 : 7;
    }

    const matches = stats?.matches || [];
    const weakAndPartial = matches.filter((m) => m.match === "weak" || m.match === "partial").map((m) => m.label);
    const strong = matches.filter((m) => m.match === "strong").map((m) => m.label);
    const allSkills = matches.map((m) => m.label);

    const levelKey = experienceLevel || "Confirmé (3-7 ans)";
    const lc = LEVEL_CONFIG[levelKey] || LEVEL_CONFIG["Confirmé (3-7 ans)"];

    const sector = jobData?.companyInfo?.sector || "non précisé";
    const company = jobData?.company || "l'entreprise";

    const prompt = `Tu es un expert en préparation d'entretien. Génère un plan de ${planDays} jours en JSON valide.

CONTEXTE :
- Poste : ${jobData?.title} chez ${company}
- Secteur : ${sector}
- Intensité : ${ic.description} (${ic.dailyTime} par jour)
- Niveau d'expérience : ${levelKey}
- Compétences à renforcer : ${weakAndPartial.length > 0 ? weakAndPartial.join(", ") : "aucune faiblesse identifiée"}
- Points forts à consolider : ${strong.length > 0 ? strong.join(", ") : "à évaluer"}
- Toutes les compétences requises : ${allSkills.join(", ")}
${jobData?.companyInfo?.competitors?.length ? `- Concurrents : ${jobData.companyInfo.competitors.join(", ")}` : ""}
${jobData?.companyInfo?.techStack?.length ? `- Outils du poste : ${jobData.companyInfo.techStack.join(", ")}` : ""}
${interviewerRole ? `- Interlocuteur : ${interviewerRole} — adapte les exercices et questions d'entretien pour correspondre aux attentes de ce profil. Un CTO posera des questions techniques stratégiques, un DRH des questions comportementales, un Manager des mises en situation, etc.` : ""}

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
    "focus": "Mot-clé",
    "items": [
      {
        "type": "note",
        "title": "Titre précis de la leçon",
        "duration": "20 min",
        "content": {
          "summary": "Explication DÉTAILLÉE en 5-8 phrases.",
          "keyPoints": ["Point détaillé avec explication complète"],
          "tips": ["Astuce concrète"],
          "links": [{"label": "Nom descriptif", "url": "URL SPÉCIFIQUE", "type": "article"}]
        },
        "miniQuiz": [{"q": "Question ?", "options": ["A", "B", "C", "D"], "correct": 0}]
      },
      {
        "type": "exercise",
        "title": "Exercice pratique",
        "duration": "30 min",
        "content": {
          "objective": "Objectif précis",
          "steps": ["Étape détaillée"],
          "tips": ["Conseil pratique"],
          "links": [{"label": "Nom", "url": "URL spécifique", "type": "lab"}]
        }
      },
      {
        "type": "quiz",
        "title": "Quiz du jour",
        "duration": "10 min",
        "content": {
          "questions": [{"q": "Question ?", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "Pourquoi"}]
        }
      }
    ]
  }
]

RÈGLES :
1. ${planDays} jours, ${ic.itemsPerDay} items chacun
2. Chaque jour finit par un quiz (${ic.quizQuestions} questions)
3. Les notes ont des miniQuiz (1-2 questions)
4. URLS : utilise UNIQUEMENT les domaines de la liste ci-dessus. NE PAS inventer de sous-pages.
5. Adapte au domaine du poste (${sector}).
6. Un jour sur ${company} : produits, actualités, culture
7. Dernier jour = révision + quiz final 10 questions
8. Contenu concret avec vrais exemples adaptés au secteur
9. JSON COMPLET et VALIDE, pas de troncature
10. Pas de guillemets courbes ni retours à la ligne dans les strings
11. Concentre les premiers jours sur les compétences faibles/partielles
12. Adapte la difficulté au niveau ${levelKey} : ${lc.quizDifficulty}

JSON uniquement :`;

    // ─── STREAMING : envoie des heartbeats pour éviter le 504 ───
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Envoie un heartbeat toutes les 8 secondes pendant la génération
        const heartbeat = setInterval(() => {
          try { controller.enqueue(encoder.encode(" ")); } catch {}
        }, 8000);

        let result = null;
        let lastError = null;

        try {
          // 2 tentatives max (au lieu de 3) pour rester dans les temps
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              console.log(`Tentative ${attempt + 1}/2 de génération du plan...`);

              const message = await anthropic.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: 8192,
                messages: [{ role: "user", content: prompt }],
              });

              const text = message.content[0].text;
              const parsed = cleanAndValidate(text);

              if (parsed) {
                console.log(`Plan validé à la tentative ${attempt + 1}`);
                result = parsed;
                break;
              }
              console.warn(`Tentative ${attempt + 1}: JSON invalide ou structure incorrecte`);
            } catch (err) {
              console.error(`Tentative ${attempt + 1} erreur:`, err.message);
              lastError = err;
            }
          }
        } finally {
          clearInterval(heartbeat);
        }

        if (result) {
          controller.enqueue(encoder.encode(JSON.stringify(result)));
        } else {
          controller.enqueue(
            encoder.encode(JSON.stringify({ error: lastError?.message || "Impossible de générer le plan. Réessaie." }))
          );
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.error("Plan generation error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
