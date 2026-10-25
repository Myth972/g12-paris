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
