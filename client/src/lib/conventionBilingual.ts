/**
 * Bloc bilingue de la page Convention G12 — source unique des textes.
 *
 * Le bloc est rédigé une seule fois, en français (voir
 * `ConventionBilingualEditor`) : l'anglais n'est qu'une suggestion traduite,
 * modifiable avant enregistrement. Ce module centralise les valeurs par
 * défaut et les clés `site_settings` pour que la page et l'éditeur ne
 * puissent pas diverger.
 */

export type BilingualLang = "fr" | "en";

/** Champs réellement rédigés (titre, texte, nom, sous-titre, appel). */
export interface BilingualTexts {
  title: string;
  body: string;
  eventName: string;
  subtitle: string;
  cta: string;
}

/** Toutes les clés du bloc, y compris lieu et dates (dates auto-générées). */
export interface BilingualKeys extends BilingualTexts {
  location: string;
  dates: string;
}

export const BILINGUAL_DEFAULTS: Record<BilingualLang, BilingualTexts> = {
  fr: {
    title: "NOUS SOMMES DANS LES TEMPS\nET L'HEURE N'EST PLUS À L'ATTENTE",
    body: "Un appel résonne à nouveau. Aller, faire des disciples et voir une génération entière se lever pour Jésus!",
    eventName: "CONVENTION G12 FRANCE 2026",
    subtitle: "ALLEZ, FAITES DES DISCIPLES",
    cta: "Inscriptions bientôt ouvertes",
  },
  en: {
    title: "WE ARE LIVING IN THE TIMES\nAND THIS IS NO TIME TO WAIT",
    body: "The call is sounding once again. To go, make disciples, and see an entire generation rise for Jesus!",
    eventName: "G12 FRANCE CONVENTION 2026",
    subtitle: "GO AND MAKE DISCIPLES",
    cta: "Registration Opens Soon",
  },
};

/**
 * Suffixes de clés — la page lit `pageText.convention-g12.<suffixe>`.
 * Les dates ont un suffixe par langue mais leur valeur vient des réglages
 * d'événement (Admin → Design), sauf surcharge manuelle.
 */
export const BILINGUAL_KEYS: Record<BilingualLang, BilingualKeys> = {
  fr: {
    title: "bilingual_fr_title",
    body: "bilingual_fr_body",
    eventName: "bilingual_fr_event_name",
    subtitle: "bilingual_fr_subtitle",
    cta: "bilingual_fr_cta",
    location: "bilingual_fr_location",
    dates: "bilingual_fr_dates",
  },
  en: {
    title: "bilingual_en_title",
    body: "bilingual_en_body",
    eventName: "bilingual_en_event_name",
    subtitle: "bilingual_en_subtitle",
    cta: "bilingual_en_cta",
    location: "bilingual_en_location",
    dates: "bilingual_en_dates",
  },
};

/** Lieu partagé par les deux langues (nom propre, jamais traduit ici). */
export const BILINGUAL_LOCATION_DEFAULT = "PARIS";
