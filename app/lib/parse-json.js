/**
 * Parse du JSON retourné par Claude de manière robuste.
 * Gère les trailing commas, guillemets courbes, caractères de contrôle,
 * JSON tronqué, et plein d'autres cas problématiques.
 */

function cleanRaw(raw) {
  return raw
    .replace(/```json\s*/g, "")
    .replace(/```\s*/g, "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ") // control chars sauf \n \r \t
    .replace(/\u201c|\u201d/g, '"')          // guillemets courbes doubles
    .replace(/\u2018|\u2019/g, "'")          // apostrophes courbes
    .replace(/\u00a0/g, " ")                 // non-breaking spaces
    .replace(/\t/g, "  ");
}

function fixTrailingCommas(str) {
  return str.replace(/,\s*([}\]])/g, "$1");
}

function fixNewlinesInStrings(raw) {
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
  return result;
}

/**
 * Tente de fermer un JSON tronqué (tableau ou objet) en ajoutant
 * les crochets/accolades manquants.
 */
function tryCloseTruncatedJSON(raw) {
  // Compter les ouvertures/fermetures
  let inStr = false, escaped = false;
  const stack = [];
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "[" || ch === "{") stack.push(ch);
    if (ch === "]" || ch === "}") stack.pop();
  }

  if (stack.length === 0) return raw; // déjà fermé

  // Fermer la string si on est dedans
  let fixed = raw;
  if (inStr) fixed += '"';

  // Supprimer un dernier "," ou ":" orphelin
  fixed = fixed.replace(/[,:]\s*$/, "");

  // Fermer les structures ouvertes dans l'ordre inverse
  for (let i = stack.length - 1; i >= 0; i--) {
    fixed += stack[i] === "[" ? "]" : "}";
  }

  return fixed;
}

export function safeParseJSON(raw) {
  if (!raw || typeof raw !== "string") return null;

  // Tentative 1 : parse direct
  try { return JSON.parse(raw); } catch (_) {}

  // Tentative 2 : nettoyage standard
  try {
    const cleaned = fixTrailingCommas(cleanRaw(raw));
    return JSON.parse(cleaned);
  } catch (_) {}

  // Tentative 3 : fix newlines dans les strings + nettoyage
  try {
    const cleaned = fixTrailingCommas(fixNewlinesInStrings(cleanRaw(raw)));
    return JSON.parse(cleaned);
  } catch (_) {}

  // Tentative 4 : JSON tronqué — fermer les structures ouvertes
  try {
    const cleaned = fixTrailingCommas(fixNewlinesInStrings(cleanRaw(raw)));
    const closed = tryCloseTruncatedJSON(cleaned);
    return JSON.parse(closed);
  } catch (_) {}

  // Tentative 5 : supprimer le dernier élément (possiblement incomplet) et fermer
  try {
    const cleaned = fixTrailingCommas(fixNewlinesInStrings(cleanRaw(raw)));
    // Trouver le dernier objet complet dans un tableau
    const lastComplete = cleaned.lastIndexOf("},");
    if (lastComplete > 0) {
      const truncated = cleaned.slice(0, lastComplete + 1);
      const closed = tryCloseTruncatedJSON(truncated);
      return JSON.parse(closed);
    }
  } catch (_) {}

  return null;
}

/**
 * Extrait et parse un objet JSON {} depuis du texte brut
 */
export function extractJSONObject(text) {
  if (!text) return null;
  // Chercher le premier { et le dernier }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1) return null;

  // Si on a un } fermant, essayer l'extraction classique
  if (end > start) {
    const result = safeParseJSON(text.slice(start, end + 1));
    if (result) return result;
  }

  // Sinon, JSON potentiellement tronqué
  return safeParseJSON(text.slice(start));
}

/**
 * Extrait et parse un tableau JSON [] depuis du texte brut
 */
export function extractJSONArray(text) {
  if (!text) return null;
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1) return null;

  // Si on a un ] fermant, essayer l'extraction classique
  if (end > start) {
    const result = safeParseJSON(text.slice(start, end + 1));
    if (result && Array.isArray(result)) return result;
  }

  // Sinon, JSON potentiellement tronqué — essayer de fermer
  const result = safeParseJSON(text.slice(start));
  if (result && Array.isArray(result)) return result;

  return null;
}
