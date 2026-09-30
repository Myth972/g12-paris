import { SITE_URL } from "../../shared/const.js";

/**
 * Vérifie l'accès aux routes cron Vercel.
 *
 * Vercel Cron envoie `Authorization: Bearer <CRON_SECRET>` automatiquement
 * dès que la variable d'environnement CRON_SECRET est définie.
 * Sans secret configuré, la route est ouverte : on autorise alors
 * uniquement les appels en développement pour ne pas bloquer la prod
 * par erreur de configuration.
 */
export function isValidCronRequest(
  req: { headers: Record<string, unknown> },
  isProduction: boolean
): boolean {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    if (isProduction) {
      console.warn(
        "[Cron] CRON_SECRET absent : appel cron rejeté en production. " +
          "Définissez CRON_SECRET dans les variables Vercel."
      );
      return false;
    }
    return true;
  }

  const header = req.headers.authorization;
  const provided =
    typeof header === "string" && header.startsWith("Bearer ")
      ? header.slice(7)
      : undefined;

  // Comparaison à temps constant pour ne pas fuiter le secret par timing.
  if (!provided || provided.length !== secret.length) return false;

  let diff = 0;
  for (let i = 0; i < secret.length; i++) {
    diff |= provided.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return diff === 0;
}

export function cronHelpPayload() {
  return {
    endpoints: {
      "GET /api/cron/newsletter":
        "Digest hebdomadaire (dimanche 8h00 Europe/Paris)",
    },
    configured: Boolean(process.env.CRON_SECRET),
    site: SITE_URL,
  };
}
