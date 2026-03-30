/**
 * Parse du JSON retourné par Claude de manière robuste.
 * Gère les trailing commas, guillemets courbes, caractères de contrôle, etc.
 */
export function safeParseJSON(raw) {
  // Tentative 1 : parse direct
  try {
    return JSON.parse(raw);
  } catch (_) {}

  // Tentative 2 : nettoyage standard
  try {
    const cleaned = raw
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/[\u0000-\u001f]/g, " ")       // caractères de contrôle
      .replace(/,\s*([}\]])/g, "$1")           // trailing commas
      .replace(/\u201c|\u201d/g, '"')          // guillemets courbes doubles
      .replace(/\u2018|\u2019/g, "'")          // apostrophes courbes
      .replace(/\u00a0/g, " ")                 // non-breaking spaces
      .replace(/\t/g, " ");
    return JSON.parse(cleaned);
  } catch (_) {}

  // Tentative 3 : reconstruire en nettoyant les newlines dans les strings
  try {
    // Remplacer les vrais retours à la ligne entre guillemets par des espaces
    let inString = false;
    let escaped = false;
    let result = "";
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (escaped) { result += ch; escaped = false; continue; }
      if (ch === "\\") { result += ch; escaped = true; continue; }
      if (ch === '"') { inString = !inString; result += ch; continue; }
      if (inString && (ch === "\n" || ch === "\r")) { result += " "; continue; }
      result += ch;
    }
    const cleaned2 = result
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/[\u0000-\u001f]/g, " ");
    return JSON.parse(cleaned2);
  } catch (_) {}

  return null;
}

/**
 * Extrait et parse un objet JSON {} depuis du texte brut
 */
export function extractJSONObject(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  return safeParseJSON(match[0]);
}

/**
 * Extrait et parse un tableau JSON [] depuis du texte brut
 */
export function extractJSONArray(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  return safeParseJSON(match[0]);
}
