// ─── Sanitization & Validation des inputs utilisateur ───

/**
 * Nettoie une string : supprime les balises HTML, trim, limite la longueur.
 */
export function sanitizeString(str, maxLength = 5000) {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>/g, "")           // Supprime les balises HTML
    .replace(/javascript:/gi, "")       // Supprime les injections JS
    .replace(/on\w+\s*=/gi, "")         // Supprime les event handlers
    .trim()
    .slice(0, maxLength);
}

/**
 * Valide et nettoie une URL.
 * Retourne l'URL propre ou null si invalide.
 */
export function sanitizeUrl(url) {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    // Seuls http et https sont autorisés
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    // Bloque les URLs avec credentials
    if (parsed.username || parsed.password) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Valide un email basique.
 */
export function isValidEmail(email) {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length < 255;
}

/**
 * Sanitize un objet entier récursivement.
 * Toutes les strings sont nettoyées, les champs inattendus sont ignorés.
 */
export function sanitizeObject(obj, maxDepth = 5) {
  if (maxDepth <= 0) return {};
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.slice(0, 100).map(item => sanitizeObject(item, maxDepth - 1));

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      clean[key] = sanitizeString(value);
    } else if (typeof value === "number" || typeof value === "boolean") {
      clean[key] = value;
    } else if (typeof value === "object" && value !== null) {
      clean[key] = sanitizeObject(value, maxDepth - 1);
    }
  }
  return clean;
}
