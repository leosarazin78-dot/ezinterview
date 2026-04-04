// ─── Rate Limiter en mémoire (compatible Vercel Serverless) ───
// Pour une app à plus gros volume, remplacer par Upstash Redis (@upstash/ratelimit)
//
// Chaque instance serverless a sa propre mémoire, donc le rate limit
// est par instance. C'est suffisant pour bloquer les abus évidents,
// mais pas pour un rate limit global strict (pour ça → Upstash Redis).

const stores = {};

/**
 * Crée un rate limiter pour une route donnée.
 * @param {Object} opts
 * @param {string} opts.key - Nom unique du limiter (ex: "generate-plan")
 * @param {number} opts.maxRequests - Nombre max de requêtes
 * @param {number} opts.windowMs - Fenêtre de temps en ms (ex: 3600000 = 1h)
 * @returns {function} - (request) => { ok: boolean, remaining: number, resetAt: Date }
 */
export function createRateLimit({ key, maxRequests, windowMs }) {
  if (!stores[key]) stores[key] = new Map();
  const store = stores[key];

  // Nettoyage périodique des entrées expirées (toutes les 5 minutes)
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of store) {
      if (now > entry.resetAt) store.delete(ip);
    }
  }, 300000);

  return function checkLimit(request) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const now = Date.now();
    let entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(ip, entry);
    }

    entry.count++;

    return {
      ok: entry.count <= maxRequests,
      remaining: Math.max(0, maxRequests - entry.count),
      resetAt: new Date(entry.resetAt),
      current: entry.count,
      limit: maxRequests,
    };
  };
}

/**
 * Middleware helper : retourne une Response 429 si la limite est dépassée,
 * sinon null (= OK, continuer).
 */
export function rateLimitResponse(result) {
  if (result.ok) return null;

  return Response.json(
    {
      error: "Trop de requêtes. Réessaie plus tard.",
      retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": result.resetAt.toISOString(),
      },
    }
  );
}
