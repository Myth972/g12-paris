/**
 * Utilitaires iCalendar (.ics) — page Convention et cartes d'événements.
 * Génère un fichier .ics téléchargeable compatible Google Calendar,
 * Outlook et Apple Calendar.
 */

/** Date -> format UTC iCalendar : 20261030T070000Z */
export function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "").replace(/Z$/, "Z");
}

/** Échappe les caractères spéciaux ICS (texte du SUMMARY/DESCRIPTION) */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Découpe les longues lignes ICS (limite RFC 5545 : 75 octets) */
function foldIcsLine(line: string): string {
  if (line.length <= 73) return line;
  const parts: string[] = [line.slice(0, 73)];
    let rest = line.slice(73);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, 72)}`);
    rest = rest.slice(72);
  }
  return parts.join("\r\n");
}

interface ConventionIcsParams {
  title: string;
  description?: string;
  location?: string;
  url?: string;
  start: Date;
  end: Date;
}

/** Construit le contenu textuel du fichier .ics de l'événement */
export function buildConventionIcs({
  title,
  description,
  location,
  url,
  start,
  end,
}: ConventionIcsParams): string {
  const now = toIcsDate(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//G12 Paris Infos Medias//Convention G12//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:event-${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40)}-${start.getTime()}@g12-paris.local`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    description ? `DESCRIPTION:${escapeIcsText(description)}` : "",
    location ? `LOCATION:${escapeIcsText(location)}` : "",
    url ? `URL:${url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.map(foldIcsLine).join("\r\n");
}

/** Alias générique : utilisable pour n'importe quel événement du site. */
export const downloadIcs = downloadConventionIcs;

/** Génère et déclenche le téléchargement du fichier .ics */
export function downloadConventionIcs(params: ConventionIcsParams, filename = "convention-g12.ics"): void {
  const ics = buildConventionIcs(params);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Formate la plage de dates d'un événement pour le bloc bilingue de la page
 * Convention, dans la langue demandée :
 *
 *   FR « 30 & 31 OCTOBRE — 1ER NOVEMBRE »
 *   EN « OCTOBER 30 & 31 — NOVEMBER 1 »
 *
 * Les dates ne sont donc saisies qu'une seule fois (Admin → Design) : les
 * deux langues du bloc suivent automatiquement.
 *
 * @param startISO valeur datetime-local du réglage « début »
 * @param endISO   valeur datetime-local du réglage « fin »
 * @param lang     langue de rendu
 * @returns la plage formatée, ou une chaîne vide si les dates sont invalides
 */
export function formatEventRange(
  startISO: string,
  endISO: string,
  lang: "fr" | "en"
): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return "";
  }

  const locale = lang === "fr" ? "fr-FR" : "en-US";
  const monthOf = (date: Date) =>
    new Intl.DateTimeFormat(locale, { month: "long" })
      .format(date)
      .toUpperCase();
  // En français, le premier du mois s'écrit « 1ER »
  const day = (value: number) =>
    lang === "fr" && value === 1 ? "1ER" : String(value);

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = monthOf(start);
  const endMonth = monthOf(end);
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();
  // Nombre de jours calendaires couverts (30 oct → 1er nov = 3)
  const dayCount =
    Math.round(
      (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
        Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
        86_400_000
    ) + 1;

  // Jour unique : « 15 NOVEMBRE » / « NOVEMBER 15 »
  if (sameMonth && startDay === endDay) {
    return lang === "fr"
      ? day(startDay) + " " + startMonth
      : startMonth + " " + startDay;
  }

  // Même mois : « 12 & 13 DÉCEMBRE » / « DECEMBER 12 & 13 »
  if (sameMonth) {
    return lang === "fr"
      ? day(startDay) + " & " + day(endDay) + " " + startMonth
      : startMonth + " " + startDay + " & " + endDay;
  }

  // Trois jours à cheval sur deux mois :
  // « 30 & 31 OCTOBRE — 1ER NOVEMBRE » / « OCTOBER 30 & 31 — NOVEMBER 1 »
  if (dayCount === 3) {
    return lang === "fr"
      ? day(startDay) +
          " & " +
          day(startDay + 1) +
          " " +
          startMonth +
          " — " +
          day(endDay) +
          " " +
          endMonth
      : startMonth +
          " " +
          startDay +
          " & " +
          (startDay + 1) +
          " — " +
          endMonth +
          " " +
          endDay;
  }

  // Cas général sur deux mois : « 30 OCTOBRE — 2 NOVEMBRE »
  return lang === "fr"
    ? day(startDay) + " " + startMonth + " — " + day(endDay) + " " + endMonth
    : startMonth + " " + startDay + " — " + endMonth + " " + endDay;
}

/**
 * Formate la période de l'événement pour la pastille du bloc d'accueil :
 *
 *   « du 30 oct. au 1er nov. 2026 »
 *   « du 30 au 31 oct. 2026 »   (même mois)
 *   « le 15 nov. 2026 »         (un seul jour)
 *
 * Le libellé de la pastille (« Prochain événement ») reste un texte éditable :
 * seules les dates sont calculées, pour ne plus avoir à les réécrire après un
 * report de l'événement.
 *
 * @returns la période préfixée par sa préposition, ou "" si les dates sont invalides
 */
export function formatEventPeriod(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return "";
  }

  const dayOf = (date: Date) => {
    const value = new Intl.DateTimeFormat("fr-FR", { day: "numeric" }).format(
      date
    );
    return value === "1" ? "1er" : value;
  };
  const monthOf = (date: Date) =>
    new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date);
  const yearOf = (date: Date) => String(date.getFullYear());

  const sameDay =
    start.getDate() === end.getDate() &&
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameDay) {
    return "le " + dayOf(start) + " " + monthOf(start) + " " + yearOf(start);
  }
  if (sameMonth) {
    return (
      "du " +
      dayOf(start) +
      " au " +
      dayOf(end) +
      " " +
      monthOf(start) +
      " " +
      yearOf(start)
    );
  }
  if (sameYear) {
    return (
      "du " +
      dayOf(start) +
      " " +
      monthOf(start) +
      " au " +
      dayOf(end) +
      " " +
      monthOf(end) +
      " " +
      yearOf(end)
    );
  }
  return (
    "du " +
    dayOf(start) +
    " " +
    monthOf(start) +
    " " +
    yearOf(start) +
    " au " +
    dayOf(end) +
    " " +
    monthOf(end) +
    " " +
    yearOf(end)
  );
}
