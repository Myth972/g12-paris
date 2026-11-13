/**
 * Bloc d'accueil (hero) de la page Convention G12 — source unique.
 *
 * Le titre vit sous `pageTitle.convention-g12.*` et le texte sous
 * `pageText.convention-g12.*` : ces clés existaient déjà, ce module les
 * regroupe pour que la page et l'éditeur admin ne puissent pas diverger.
 */

/** Suffixes complets des clés `site_settings` utilisées par le hero. */
export const HERO_KEYS = {
  h1: "pageTitle.convention-g12.h1",
  h2: "pageTitle.convention-g12.h2",
  text: "pageText.convention-g12.hero",
  dateLabel: "pageText.convention-g12.date_info",
  locationLabel: "pageText.convention-g12.location_info",
} as const;

/**
 * Valeurs par défaut, utilisées tant qu'aucune valeur n'est enregistrée.
 *
 * `dateLabel` ne contient plus les dates : elles sont générées depuis les
 * réglages de l'événement (`convention.eventStart` / `eventEnd`) pour ne pas
 * avoir à les réécrire à chaque report.
 */
export const HERO_DEFAULTS = {
  h1: "Bienvenue à la Convention G12 France",
  h2: "",
  text: "Rejoignez-nous pour cet événement exceptionnel de transformation, d'équipement et de vision. Vivez la puissance de la vision G12 en France.",
  dateLabel: "Prochain événement",
  locationLabel: "En ligne & En présentiel",
} as const;
