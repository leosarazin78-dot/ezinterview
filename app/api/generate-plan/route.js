import Anthropic from "@anthropic-ai/sdk";
import { extractJSONArray } from "../../lib/parse-json";
import { createRateLimit, rateLimitResponse } from "../../lib/rate-limit";
import { sanitizeObject, sanitizeUrl } from "../../lib/sanitize";
import { planRequestSchema } from "../../lib/validation";

// Augmenter le timeout Next.js (300s = 5 min)
export const maxDuration = 300;

const anthropic = new Anthropic();

// Rate limit : 5 plans par heure par IP (appel coûteux)
const checkLimit = createRateLimit({ key: "generate-plan", maxRequests: 5, windowMs: 3600000 });

const SOURCES_INSTRUCTIONS = `
RÈGLES POUR LES LIENS ET LE CONTENU :

1. CONTENU AUTONOME MAIS CONCIS : Chaque note doit permettre d'apprendre SANS cliquer sur les liens, mais être COURTE. Le summary = 2-3 phrases max. Utilise les "sections" pour structurer le contenu en sous-parties claires. Les keyPoints = phrases courtes (max 15 mots chacun). Les liens sont un bonus.

2. PRIORITÉ AU CONTENU : Si tu n'es pas ABSOLUMENT CERTAIN qu'une URL existe, NE L'INCLUS PAS. Il vaut mieux zéro lien qu'un seul lien mort. Mieux vaut enrichir le summary et les keyPoints que de risquer un lien cassé.

3. LIENS RACINE UNIQUEMENT : Utilise UNIQUEMENT les pages racine des documentations dont tu es certain de l'existence. Ne crée jamais de sous-chemins. Exemples sûrs :
- https://developer.mozilla.org/fr/docs/Web/JavaScript (racine JavaScript)
- https://react.dev/learn (section learn de React)
- https://docs.python.org/3/tutorial (tutoriel Python)
- https://nodejs.org/en/docs (documentation Node)
N'invente JAMAIS de sous-chemins. Utilise uniquement des URLs dont tu es certain de l'existence.

4. PAS DE YOUTUBE : N'inclus pas de liens YouTube. Les identifiants sont trop souvent inexacts ou cassés. Privilégie plutôt du contenu textuel détaillé dans le plan.

EXEMPLES DE BONS LIENS (pages racines vérifiées) :
- https://developer.mozilla.org/fr/docs/Web/JavaScript
- https://react.dev/learn
- https://docs.python.org/3/tutorial
- https://www.coursera.org (page d'accueil OK si pas de cours spécifique)
- https://www.w3schools.com
- https://www.investopedia.com
- https://www.legifrance.gouv.fr
- https://leetcode.com
- https://exercism.org
- https://academy.hubspot.com
- https://fr.wikipedia.org

EXEMPLES DE MAUVAIS LIENS (à ÉVITER) :
- https://www.youtube.com/watch?v=FAKE_ID_INVENTED
- https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Statements/async_function (si pas sûr)
- Tout lien avec un sous-chemin spécifique dont tu n'es pas certain

5. DOMAINES AUTORISÉS pour les liens :
coursera.org, edx.org, openclassrooms.com, fun-mooc.fr, khanacademy.org, ocw.mit.edu,
developer.mozilla.org, react.dev, docs.python.org, nodejs.org, w3schools.com, leetcode.com, exercism.org, github.com,
investopedia.com, lesechos.fr, hbr.org, banque-france.fr, insee.fr,
legifrance.gouv.fr, service-public.fr, eur-lex.europa.eu, dalloz.fr,
who.int, has-sante.fr, pubmed.ncbi.nlm.nih.gov, vidal.fr,
academy.hubspot.com, skillshop.withgoogle.com, statista.com,
architectes.org, batiactu.com, eduscol.education.fr, education.gouv.fr, reseau-canope.fr,
artisanat.fr, compagnons-du-devoir.com, fr.wikipedia.org, scholar.google.com

6. Si tu ne connais pas d'URL spécifique VÉRIFIÉE pour un sujet, NE METS PAS de lien. Enrichis plutôt le summary et les keyPoints avec du contenu détaillé.
`;

const INTENSITY_CONFIG = {
  "Léger": { itemsPerDay: "4-5", quizQuestions: "5-8", description: "plan léger adapté à un emploi du temps chargé" },
  "Standard": { itemsPerDay: "5-8", quizQuestions: "8-10", description: "plan équilibré entre effort et efficacité" },
  "Intensif": { itemsPerDay: "8-12", quizQuestions: "10-15", description: "plan intensif pour une préparation en profondeur" },
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

    let validated;
    try {
      validated = planRequestSchema.parse(raw);
    } catch (err) {
      return Response.json({ error: "Données invalides", details: err.errors?.map(e => e.message) }, { status: 400 });
    }

    // Use validated data
    const { jobData, stats, intensity, experienceLevel, interviewerRole, interviewDate, daysUntilInterview } = validated;

    if (!jobData) return Response.json({ error: "Données manquantes" }, { status: 400 });

    const intensityKey = intensity || "Standard";
    const ic = INTENSITY_CONFIG[intensityKey] || INTENSITY_CONFIG["Standard"];
    // Priorité à daysUntilInterview si fourni
    // Si daysUntilInterview > 14, cap à 14 pour les coûts API
    // Si daysUntilInterview > 0 et <= 14, utilise la vraie durée
    // Sinon, utilise la logique basée sur l'intensité
    let planDays;
    if (daysUntilInterview && daysUntilInterview > 0) {
      // Le plan couvre CHAQUE jour jusqu'à l'entretien (max 30 pour coûts API)
      planDays = Math.min(daysUntilInterview, 30);
    } else {
      // Sans date : adapte à l'intensité
      planDays = intensityKey === "Léger" ? 10 : intensityKey === "Intensif" ? 5 : 7;
    }
    // Plus de jours = plus de contenu par jour adapté au temps quotidien
    const totalHours = planDays * (intensityKey === "Léger" ? 0.5 : intensityKey === "Intensif" ? 2 : 1);

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
- Intensité : ${ic.description} (${ic.itemsPerDay} activités par jour sur ${planDays} jours)
- Niveau d'expérience : ${levelKey}
- Compétences à renforcer : ${weakAndPartial.length > 0 ? weakAndPartial.join(", ") : "aucune faiblesse identifiée"}
- Points forts à consolider : ${strong.length > 0 ? strong.join(", ") : "à évaluer"}
- Toutes les compétences requises : ${allSkills.join(", ")}
${jobData?.companyInfo?.competitors?.length ? `- Concurrents : ${jobData.companyInfo.competitors.join(", ")}` : ""}
${jobData?.companyInfo?.techStack?.length ? `- Outils du poste : ${jobData.companyInfo.techStack.join(", ")}` : ""}
${interviewerRole ? `- Interlocuteur : ${interviewerRole} — adapte les exercices et questions d'entretien pour correspondre aux attentes de ce profil. Un CTO posera des questions techniques stratégiques, un DRH des questions comportementales, un Manager des mises en situation, etc.

SECTION DÉDIÉE INTERLOCUTEUR — OBLIGATOIRE :
Ajoute au Jour 1 un item de type "note" intitulé "Comprendre ton interlocuteur : ${interviewerRole}" qui explique :
1. Ce que ce profil (${interviewerRole}) évalue typiquement en entretien (compétences techniques, soft skills, culture fit, vision stratégique, etc.)
2. Les questions types qu'il/elle pose et ce qu'il/elle cherche derrière chaque question
3. Les erreurs à éviter face à ce type d'interlocuteur
4. Comment adapter ton discours et tes exemples pour ce profil spécifique
5. Les signaux positifs que ce profil recherche chez un candidat
Ce contenu doit être concret et actionnable, pas générique.` : ""}

ADAPTATION AU NIVEAU (${levelKey}) :
${lc.focus}
Niveau des ressources : ${lc.resourceLevel}
Quiz : ${lc.quizDifficulty}

${SOURCES_INSTRUCTIONS}

FORMAT JSON — retourne UNIQUEMENT ce tableau :
[
  {
    "day": 1,
    "title": "Titre court du jour (max 5 mots)",
    "focus": "Mot-clé",
    "items": [
      {
        "type": "note",
        "title": "Titre précis (max 8 mots)",
        "content": {
          "summary": "Explication détaillée en 4-6 phrases. Couvre le sujet en profondeur avec des exemples concrets.",
          "sections": [
            {
              "heading": "Sous-titre du concept",
              "points": ["Point détaillé avec exemple (2 phrases)", "Point détaillé (2 phrases)", "Point détaillé (2 phrases)"]
            },
            {
              "heading": "Deuxième sous-partie",
              "points": ["Point détaillé (2 phrases)", "Point détaillé (2 phrases)"]
            }
          ],
          "keyPoints": ["Point clé détaillé (max 20 mots)", "Deuxième point clé", "Troisième point clé"],
          "tips": ["Astuce pratique détaillée", "Deuxième astuce"],
          "links": [{"label": "Nom", "url": "URL VÉRIFIÉE", "type": "article"}]
        },
        "miniQuiz": [{"q": "Question ?", "options": ["A", "B", "C", "D"], "correct": 0}]
      },
      {
        "type": "exercise",
        "title": "Exercice pratique (max 8 mots)",
        "content": {
          "objective": "Objectif en 1 phrase",
          "steps": ["Étape détaillée et actionnable", "Deuxième étape", "Troisième étape"],
          "tips": ["Conseil détaillé", "Deuxième conseil"],
          "links": [{"label": "Nom", "url": "URL", "type": "lab"}]
        }
      },
      {
        "type": "quiz",
        "title": "Quiz du jour",
        "content": {
          "questions": [{"q": "Question ?", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "Explication en 1 phrase"}]
        }
      }
    ]
  }
]

RÈGLES DE CONTENU — TRÈS IMPORTANT :

⚠️ NOMBRE DE JOURS — RÈGLE ABSOLUE ⚠️
Le tableau JSON DOIT contenir EXACTEMENT ${planDays} objets jour (day: 1 à day: ${planDays}).
PAS ${planDays - 1}. PAS ${planDays + 1}. EXACTEMENT ${planDays}.
Si tu génères moins de ${planDays} jours, le plan est INVALIDE et sera rejeté.
Vérifie que le dernier élément du tableau a "day": ${planDays}.

1. ${ic.itemsPerDay} items par jour. Le plan couvre les ${planDays} jours complets du jour 1 au jour ${planDays}.
2. CONTENU TECHNIQUE ET PROFOND — PAS DE BLABLA :
   - Pour les entretiens techniques : inclus des questions d'entretien RÉELLES et CONCRÈTES (ex: "Expliquez la différence entre X et Y", "Comment résoudriez-vous ce problème ?", "Quel est le Big-O de cet algorithme ?")
   - Chaque note doit contenir des EXEMPLES DE CODE, des SCHÉMAS MENTAUX, des CAS CONCRETS — pas des généralités
   - Les exercices doivent être des VRAIS exercices techniques : debugging, refactoring, conception, implémentation
   - summary = 4-6 phrases TECHNIQUES avec exemples concrets et cas réels
   - sections = 3-4 sous-parties avec 3-4 points DÉTAILLÉS et TECHNIQUES (pas de phrases vagues)
   - keyPoints = 4-6 points ACTIONABLES que le candidat peut utiliser en entretien
3. SOUS-CHAPITRES : Utilise "sections" pour découper en 3-4 sous-parties avec "heading" clair et 3-4 "points" développés (2 phrases min chacun, EXEMPLES CONCRETS). Scannable ET profond.
4. PAS DE DURÉE : N'inclus PAS de champ "duration".
5. Chaque jour finit par un quiz (${ic.quizQuestions} questions)
6. QUIZ DIFFÉRENCIÉS — CRITIQUE : Les miniQuiz testent la COMPRÉHENSION IMMÉDIATE. Le quiz de fin de journée teste la MISE EN SITUATION avec des scénarios d'entretien réalistes. Zéro doublon.
7. Les notes ont des miniQuiz (1-2 questions techniques de compréhension directe)
8. URLS : UNIQUEMENT les domaines de la liste ci-dessus. NE PAS inventer de sous-pages.
9. Adapte au domaine du poste (${sector}). Pour les postes techniques, CHAQUE jour doit avoir au moins 1 exercice pratique ou problème à résoudre.
10. Jour 1 ou 2 : inclus un item 'culture' sur ${company}.
11. Dernier jour = révision intensive + quiz final 15 questions de mise en situation d'entretien
12. JSON COMPLET et VALIDE, pas de troncature. Rappel : EXACTEMENT ${planDays} jours.
13. Répartis les compétences uniformément. Premiers jours = fondamentaux et faiblesses. Milieu = approfondissement technique. Derniers jours = simulation d'entretien et révision.
14. Adapte la difficulté au niveau ${levelKey} : ${lc.quizDifficulty}
15. PROFONDEUR TECHNIQUE : Le candidat doit pouvoir RÉPONDRE à des questions d'entretien après avoir lu le plan. Inclus :
    - Questions d'entretien types avec réponses attendues
    - Pièges courants à éviter en entretien
    - Exemples de réponses structurées (méthode STAR pour comportemental, approche systématique pour technique)
    - Cas pratiques issus du vrai monde professionnel

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

              // Plus de jours = plus de tokens nécessaires
              const maxTokens = planDays <= 5 ? 16000 : planDays <= 10 ? 24000 : planDays <= 20 ? 32000 : 40000;
              const message = await anthropic.messages.create({
                model: "claude-sonnet-4-20250514",
                max_tokens: maxTokens,
                messages: [{ role: "user", content: prompt }],
              });

              const text = message.content[0].text;
              const parsed = cleanAndValidate(text);

              if (parsed) {
                // Vérifier que le nombre de jours est correct
                if (parsed.length !== planDays) {
                  console.warn(`Tentative ${attempt + 1}: ${parsed.length} jours au lieu de ${planDays} — ajustement...`);
                  // Si trop de jours, on tronque
                  if (parsed.length > planDays) {
                    result = parsed.slice(0, planDays).map((d, idx) => ({ ...d, day: idx + 1 }));
                  } else {
                    // Si pas assez de jours, on accepte quand même (mieux que rien) mais on log
                    console.warn(`Plan incomplet: ${parsed.length}/${planDays} jours. Accepté.`);
                    result = parsed.map((d, idx) => ({ ...d, day: idx + 1 }));
                  }
                } else {
                  result = parsed.map((d, idx) => ({ ...d, day: idx + 1 }));
                }
                console.log(`Plan validé à la tentative ${attempt + 1} : ${result.length} jours`);
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
