import Anthropic from "@anthropic-ai/sdk";
import { extractJSONObject } from "../../lib/parse-json";

const anthropic = new Anthropic();

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const text = formData.get("text");
    const linkedin = formData.get("linkedin");

    let cvContent = "";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = file.name.toLowerCase();

      if (filename.endsWith(".txt") || filename.endsWith(".rtf")) {
        cvContent = buffer.toString("utf-8");
      } else if (filename.endsWith(".pdf")) {
        try {
          const pdfParse = (await import("pdf-parse")).default;
          const data = await pdfParse(buffer);
          cvContent = data.text;
        } catch (e) {
          cvContent = buffer.toString("utf-8").replace(/[^\x20-\x7E\u00C0-\u024F\n]/g, " ");
        }
      } else if (filename.endsWith(".docx") || filename.endsWith(".doc")) {
        try {
          const mammoth = await import("mammoth");
          const result = await mammoth.extractRawText({ buffer });
          cvContent = result.value;
        } catch (e) {
          cvContent = buffer.toString("utf-8").replace(/[^\x20-\x7E\u00C0-\u024F\n]/g, " ");
        }
      } else {
        cvContent = buffer.toString("utf-8");
      }
    } else if (text) {
      cvContent = text;
    }

    if (!cvContent.trim()) {
      return Response.json({ error: "Aucun contenu de CV détecté" }, { status: 400 });
    }

    // Ajouter le LinkedIn si fourni
    let fullProfile = cvContent.slice(0, 6000);
    if (linkedin) {
      fullProfile += `\n\nProfil LinkedIn fourni : ${linkedin}`;
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Analyse ce CV et extrais un profil structuré en JSON strict. Ne retourne QUE le JSON.

CV :
${fullProfile}

Format :
{
  "name": "Nom complet",
  "currentRole": "Poste actuel",
  "experience": "X ans d'expérience",
  "skills": ["Compétence1", "Compétence2"],
  "techStack": ["Tech1", "Tech2"],
  "highlights": ["Point fort 1", "Point fort 2"],
  "education": "Formation principale"
}

Extrais uniquement les compétences TECHNIQUES.`,
        },
      ],
    });

    const responseText = message.content[0].text;
    const parsed = extractJSONObject(responseText);
    if (!parsed) return Response.json({ error: "Erreur d'analyse du CV. Réessaie." }, { status: 500 });

    return Response.json(parsed);
  } catch (err) {
    console.error("CV parse error:", err);
    return Response.json({ error: "Erreur : " + err.message }, { status: 500 });
  }
}