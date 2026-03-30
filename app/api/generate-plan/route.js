import Anthropic from "@anthropic-ai/sdk";
import { extractJSONArray } from "../../lib/parse-json";

const anthropic = new Anthropic();

export async function POST(request) {
  try {
    const { jobData, matches, priorities, interviewDate, nextInterlocutor, companyInfo } = await request.json();

    if (!priorities?.length || !interviewDate)
      return Response.json({ error: "Données manquantes" }, { status: 400 });

    const daysAvailable = Math.max(1, Math.ceil((new Date(interviewDate) - new Date()) / 86400000));
    const planDays = Math.min(daysAvailable, 14);

    const priorityLabels = priorities
      .map((id) => matches?.find((m) => m.reqId === id || m.reqId === String(id))?.label)
      .filter(Boolean);

    const sector = companyInfo?.sector || jobData?.companyInfo?.sector || "non précisé";
    const company = jobData?.company || "l'entreprise";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Tu es un expert en preparation d'entretien professionnel, tous secteurs confondus. Cree un plan de preparation COMPLET et INTERACTIF de ${planDays} jours.

CONTEXTE :
- Poste : ${jobData?.title} chez ${company}
- Secteur : ${sector}
- Entretien dans ${daysAvailable} jours${nextInterlocutor ? ` avec ${nextInterlocutor}` : ""}
- Competences prioritaires a travailler : ${priorityLabels.join(", ")}
${companyInfo ? `- Concurrents : ${companyInfo.competitors?.join(", ")}` : ""}
${companyInfo?.techStack?.length ? `- Outils/methodes utilises : ${companyInfo.techStack.join(", ")}` : ""}

IMPORTANT : Le plan doit etre adapte au DOMAINE du poste.
- Pour un poste technique (dev, data, ingenieur) : exercices de code, system design, algorithmes
- Pour un poste en finance/economie : etudes de cas, analyse financiere, modelisation, actualite economique
- Pour un poste en droit : cas pratiques juridiques, jurisprudence, analyse de contrats
- Pour un poste litteraire/communication : analyse de texte, redaction, etude de campagnes, portfolio review
- Pour un poste commercial/marketing : role-plays de vente, etudes de marche, analyse de KPIs, cas business
- Pour un poste en sante/social : etudes de cas cliniques, protocoles, reglementation
- Pour un poste en gestion/management : etudes de cas, gestion de projet, analyse strategique
- Adapte les exercices et ressources au domaine specifique du poste

STRUCTURE JSON STRICTE — chaque jour contient des items, chaque item est RICHE :

[
  {
    "day": 1,
    "title": "Titre descriptif du jour",
    "focus": "Mot-cle court",
    "items": [
      {
        "type": "note",
        "title": "Titre clair et specifique",
        "duration": "XX min",
        "content": {
          "summary": "Resume en 3-5 phrases de ce qu'il faut retenir",
          "keyPoints": ["Point cle 1", "Point cle 2", "Point cle 3"],
          "tips": ["Astuce pratique 1", "Astuce pratique 2"],
          "links": [
            {"label": "Nom du cours/article", "url": "URL reelle vers une ressource specifique", "type": "article"},
            {"label": "Nom de la video", "url": "URL YouTube ou autre reelle", "type": "video"}
          ]
        },
        "miniQuiz": [
          {"q": "Question de verification rapide ?", "options": ["A", "B", "C", "D"], "correct": 0}
        ]
      },
      {
        "type": "exercise",
        "title": "Exercice pratique specifique au domaine",
        "duration": "XX min",
        "content": {
          "objective": "Ce que l'exercice permet de pratiquer",
          "steps": ["Etape 1", "Etape 2", "Etape 3"],
          "tips": ["Conseil pour reussir"],
          "links": [
            {"label": "Plateforme ou ressource d'exercices", "url": "URL reelle", "type": "lab"}
          ]
        }
      },
      {
        "type": "quiz",
        "title": "Quiz de verification : [theme]",
        "duration": "10-15 min",
        "content": {
          "questions": [
            {"q": "Question ?", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "Explication de la bonne reponse"},
            {"q": "Question 2 ?", "options": ["A", "B", "C", "D"], "correct": 1, "explanation": "Explication"}
          ]
        }
      }
    ]
  }
]

REGLES CRITIQUES :
1. Chaque jour a ${planDays <= 7 ? "4-6" : "3-5"} items
2. Chaque jour FINIT par un quiz de 5-8 questions
3. Les "note" et "memo" ont des miniQuiz de 1-2 questions
4. Les liens doivent etre des URLs REELLES et FONCTIONNELLES adaptees au domaine :
   - Tech/dev : MDN, freeCodeCamp, LeetCode, HackerRank, CodeSandbox, docs officielles
   - Finance/eco : Investopedia, Khan Academy (finance), Coursera (finance courses), Les Echos, Bloomberg
   - Droit : Legifrance, Dalloz, cours-de-droit.net, Coursera (law courses)
   - Marketing/commerce : HubSpot Academy, Google Digital Garage, Think with Google, Coursera
   - Sante : OMS, HAS, Coursera (health courses), PubMed
   - Sciences sociales/lettres : OpenClassrooms, edX, MIT OpenCourseWare, JSTOR, Cairn.info
   - General : Khan Academy, Coursera, edX, OpenClassrooms, YouTube (videos educatives populaires)
5. Le contenu des notes doit etre CONCRET : pas de "apprenez ceci", mais du vrai contenu avec les points cles
6. Inclure au moins 1 jour complet sur ${company} : produits, services, actualites, concurrents, culture, positionnement dans le marche
7. Le dernier jour = revision + quiz final recapitulatif (10 questions)
8. Les exercices doivent etre adaptes au metier : etude de cas, analyse, redaction, calcul, code, mise en situation...
9. Concentre-toi sur les competences metier et la connaissance entreprise/secteur
10. ${planDays} jours exactement

Retourne UNIQUEMENT le JSON valide.`,
        },
      ],
    });

    const text = message.content[0].text;
    const parsed = extractJSONArray(text);
    if (!parsed)
      return Response.json({ error: "Le plan généré contient du JSON invalide. Réessaie." }, { status: 500 });

    return Response.json(parsed);
  } catch (err) {
    console.error("Plan generation error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}