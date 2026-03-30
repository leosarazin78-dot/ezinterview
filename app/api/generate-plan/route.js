import Anthropic from "@anthropic-ai/sdk";

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
          content: `Tu es un expert en préparation d'entretien. Crée un plan de préparation COMPLET et INTERACTIF de ${planDays} jours.

CONTEXTE :
- Poste : ${jobData?.title} chez ${company}
- Secteur : ${sector}
- Entretien dans ${daysAvailable} jours${nextInterlocutor ? ` avec ${nextInterlocutor}` : ""}
- Sujets prioritaires : ${priorityLabels.join(", ")}
${companyInfo ? `- Concurrents : ${companyInfo.competitors?.join(", ")}` : ""}
${companyInfo ? `- Stack technique : ${companyInfo.techStack?.join(", ")}` : ""}

STRUCTURE JSON STRICTE — chaque jour contient des items, chaque item est RICHE :

[
  {
    "day": 1,
    "title": "Titre descriptif du jour",
    "focus": "Mot-clé court",
    "items": [
      {
        "type": "note",
        "title": "Titre clair et spécifique",
        "duration": "XX min",
        "content": {
          "summary": "Résumé en 3-5 phrases de ce qu'il faut retenir",
          "keyPoints": ["Point clé 1", "Point clé 2", "Point clé 3"],
          "tips": ["Astuce pratique 1", "Astuce pratique 2"],
          "links": [
            {"label": "Nom du cours/article", "url": "URL réelle vers un chapitre spécifique", "type": "article"},
            {"label": "Nom de la vidéo YouTube", "url": "URL YouTube réelle", "type": "video"}
          ]
        },
        "miniQuiz": [
          {"q": "Question de vérification rapide ?", "options": ["A", "B", "C", "D"], "correct": 0}
        ]
      },
      {
        "type": "exercise",
        "title": "Lab : exercice pratique spécifique",
        "duration": "XX min",
        "content": {
          "objective": "Ce que l'exercice permet de pratiquer",
          "steps": ["Étape 1 de l'exercice", "Étape 2", "Étape 3"],
          "tips": ["Conseil pour réussir"],
          "links": [
            {"label": "Lien vers un lab en ligne / plateforme d'exercices", "url": "URL réelle", "type": "lab"}
          ]
        }
      },
      {
        "type": "quiz",
        "title": "Quiz de vérification : [thème]",
        "duration": "10-15 min",
        "content": {
          "questions": [
            {"q": "Question ?", "options": ["A", "B", "C", "D"], "correct": 0, "explanation": "Explication de la bonne réponse"},
            {"q": "Question 2 ?", "options": ["A", "B", "C", "D"], "correct": 1, "explanation": "Explication"}
          ]
        }
      }
    ]
  }
]

RÈGLES CRITIQUES :
1. Chaque jour a ${planDays <= 7 ? "4-6" : "3-5"} items
2. Chaque jour FINIT par un quiz de 5-8 questions
3. Les "note" et "memo" ont des miniQuiz de 1-2 questions
4. Les liens doivent être des URLs RÉELLES et FONCTIONNELLES :
   - Vidéos YouTube : cherche des vidéos populaires qui existent vraiment sur le sujet
   - Cours : MDN, freeCodeCamp, W3Schools, Khan Academy, Coursera chapters, OpenClassrooms, docs officielles
   - Labs : CodeSandbox, StackBlitz, LeetCode, HackerRank, Codecademy labs, exercism.io, ou tout autre plateforme adaptée au domaine
   - Pour le BTP/chimie/économie etc : utilise des ressources comme Khan Academy, MIT OpenCourseWare, Coursera, edX, les docs professionnelles du secteur
5. Le contenu des notes doit être CONCRET : pas de "apprenez ceci", mais du vrai contenu avec les points clés
6. Inclure au moins 1 jour complet sur ${company} : produits, actualités, concurrents, culture, positionnement
7. Le dernier jour = révision + quiz final récapitulatif (10 questions)
8. Les labs doivent avoir des liens vers des exercices en ligne adaptés au domaine du poste
9. Pas de soft skills — uniquement technique et connaissance entreprise/secteur
10. ${planDays} jours exactement

Retourne UNIQUEMENT le JSON valide.`,
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