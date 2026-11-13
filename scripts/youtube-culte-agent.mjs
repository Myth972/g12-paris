// @ts-nocheck
// Agent d'import des cultes YouTube de la chaîne G12 Paris.
//
// Principe des dates : un culte a lieu le dimanche, mais la vidéo est mise en ligne
// quelques jours plus tard. La date affichée sur le site doit donc être celle du
// dimanche du culte, jamais la date d'export YouTube. Elle est déterminée dans cet
// ordre de priorité :
//   1. la date écrite dans le titre YouTube (« …_2026 09 27 »),
//   2. la date déjà enregistrée dans la description (« Culte du … »),
//   3. le dimanche précédant la publication YouTube,
//   4. le dimanche précédant l'ajout en base.
// Quelle que soit la source, le résultat est ramené au dimanche (ou au dimanche
// précédent si la date trouvée n'est pas un dimanche).
//
// Usage : node scripts/youtube-culte-agent.mjs [--dry-run] [--no-clean]
//   --dry-run  : affiche les changements sans écrire en base.
//   --no-clean : ne supprime aucune vidéo ancienne.
import { createClient } from "@libsql/client";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
// eq() est indispensable : un `colonne === valeur` ne construit aucun filtre en drizzle,
// et l'UPDATE s'applique alors à toute la table.
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { pageContent } from "../drizzle/schema.ts";

// Les identifiants viennent de l'environnement, jamais du fichier : ce dépôt est public.
// En local, `.env` est chargé s'il existe, ce qui couvre le lancement manuel
// (`pnpm run youtube-agent`), la tâche planifiée et le passage par AgentDashboard.
const ENV_FILE = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(ENV_FILE)) {
  // loadEnvFile ne remplace pas une variable déjà définie : l'environnement reste prioritaire.
  process.loadEnvFile(ENV_FILE);
}

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error(
    "❌ Configuration manquante : TURSO_DATABASE_URL et TURSO_AUTH_TOKEN sont requis.",
  );
  console.error(`   Renseigne-les dans ${ENV_FILE} ou dans l'environnement du processus.`);
  process.exit(1);
}

const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });

const db = drizzle(client);

const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@media.mpecciparis";
const CHANNEL_ID = "UCAM9d_c1ky-lTSook4ffXbA";
const PAGE_ID = "culte-en-ligne";

// Garder uniquement les vidéos des 3 derniers mois
const MONTHS_TO_KEEP = 3;

// Nombre de vidéos récentes traitées par exécution
const MAX_VIDEOS_PER_RUN = 10;

const DRY_RUN = process.argv.includes("--dry-run");
// Le nettoyage supprime définitivement des lignes : il se désactive si besoin.
const SKIP_CLEAN = process.argv.includes("--no-clean");

const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const WEEKDAYS_FR = [
  "dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi",
];

// ─── Dates ───────────────────────────────────────────────────────

/** Normalise une date à midi, pour éviter les surprises de changement d'heure. */
function atNoon(date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d;
}

/** Le dimanche de la semaine de `date` (le jour même si c'est déjà un dimanche). */
function sundayOnOrBefore(date) {
  const d = atNoon(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function formatFullFrenchDate(date) {
  if (!date) return "";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(date) {
  if (!date) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Lit une date française écrite en toutes lettres : « dimanche 27 septembre 2026 ». */
function parseFrenchLongDate(value) {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  const monthIndex = MONTHS_FR.findIndex(month => normalized.includes(month));
  if (monthIndex === -1) return null;

  const dayMatch = normalized.match(/\b(\d{1,2})\b/);
  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  if (!dayMatch || !yearMatch) return null;

  const day = Number(dayMatch[1]);
  const year = Number(yearMatch[1]);
  if (day < 1 || day > 31) return null;

  return atNoon(new Date(year, monthIndex, day));
}

/**
 * Cherche une date dans un titre YouTube. Les titres de la chaîne portent souvent
 * leur date en format technique : « …_2026 09 27 ».
 */
function extractTitleDate(title) {
  if (!title) return null;

  // 2026 09 27 / 2026-09-27 / 2026.09.27 / 2026_09_27
  // Pas de \b devant l'année : les titres la collent à un underscore (« ROELLINGER_2026 09 27 »),
  // et « _ » est un caractère de mot, donc \b ne matcherait pas.
  const yearFirst = title.match(/(20\d{2})[\s.\-_/](\d{1,2})[\s.\-_/](\d{1,2})(?!\d)/);
  if (yearFirst) {
    const [, year, month, day] = yearFirst;
    const date = atNoon(new Date(Number(year), Number(month) - 1, Number(day)));
    if (date.getMonth() === Number(month) - 1) return date;
  }

  // 27/09/2026
  const dayFirst = title.match(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](20\d{2})\b/);
  if (dayFirst) {
    const [, day, month, year] = dayFirst;
    const date = atNoon(new Date(Number(year), Number(month) - 1, Number(day)));
    if (date.getMonth() === Number(month) - 1) return date;
  }

  return null;
}

/** Extrait la date de culte déjà stockée dans la description (nouveau ou ancien format). */
function extractCulteDateFromDescription(description) {
  if (!description) return null;
  // La description écrite par l'agent est « Culte du dimanche … » (sans deux-points),
  // tandis que l'ancien format YouTube en comportait un : on accepte les deux.
  const match = description.match(/(?:Culte du:?|Publié sur YouTube:)\s*(.+?)\s*\|/);
  return match ? parseFrenchLongDate(match[1]) : null;
}

/** Extrait la date d'ajout au site conservée dans la description. */
function extractAddedDateFromDescription(description) {
  if (!description) return null;
  const match = description.match(/Ajouté sur le site:\s*(.+?)\s*$/);
  return match ? match[1].trim() : null;
}

/**
 * Détermine la date du culte pour une vidéo.
 * Renvoie { date, source } ; `source` sert uniquement aux messages de l'agent.
 */
function resolveCulteDate({ title, description, publishedDate, createdAt }) {
  const fromTitle = extractTitleDate(title);
  if (fromTitle) {
    return { date: sundayOnOrBefore(fromTitle), source: "titre YouTube" };
  }

  const fromDescription = extractCulteDateFromDescription(description);
  if (fromDescription) {
    return { date: sundayOnOrBefore(fromDescription), source: "description" };
  }

  if (publishedDate instanceof Date && !Number.isNaN(publishedDate.getTime())) {
    return {
      date: sundayOnOrBefore(publishedDate),
      source: "publication YouTube (dimanche précédent)",
    };
  }

  if (createdAt) {
    const created = createdAt instanceof Date ? createdAt : new Date(Number(createdAt) * 1000);
    if (!Number.isNaN(created.getTime())) {
      return {
        date: sundayOnOrBefore(created),
        source: "ajout en base (dimanche précédent)",
      };
    }
  }

  return { date: null, source: "aucune" };
}

// ─── Titres et descriptions ──────────────────────────────────────

// « - dimanche 27 septembre 2026 » ajouté par une exécution précédente
const TRAILING_FRENCH_DATE =
  /\s*[-–]\s*(?:dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi)\s+\d{1,2}\s+[a-zéûà]+\s+20\d{2}\s*$/i;

// Date technique « 2026 09 27 » présente dans les titres de la chaîne
// Même remarque que dans extractTitleDate : pas de \b devant l'année, elle suit souvent un underscore.
const TECHNICAL_DATE = /\s*[-_ ]?20\d{2}[\s.\-_/]\d{1,2}[\s.\-_/]\d{1,2}(?!\d)/g;

/** Nettoie un titre de ses dates pour pouvoir en réécrire une seule, lisible. */
function stripDatesFromTitle(title) {
  return String(title || "")
    .replace(/\s+/g, " ")
    .replace(TRAILING_FRENCH_DATE, "")
    .replace(TECHNICAL_DATE, "")
    .replace(/[\s\-_]+$/g, "")
    .replace(/^[\s\-_]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Titre final : titre nettoyé + la date du dimanche du culte. */
function buildTitle({ title, culteDate }) {
  const base = stripDatesFromTitle(title).replace(/"/g, "'").trim();
  if (!culteDate) return base;
  return base ? `${base} - ${formatFullFrenchDate(culteDate)}` : formatFullFrenchDate(culteDate);
}

/** Description final : date du culte + date d'ajout au site. */
function buildDescription({ culteDate, addedDate }) {
  const parts = [];
  if (culteDate) parts.push(`Culte du ${formatFullFrenchDate(culteDate)}`);
  if (addedDate) parts.push(`Ajouté sur le site: ${addedDate}`);
  return parts.join(" | ");
}

// ─── RSS YouTube ─────────────────────────────────────────────────

function parseYouTubeDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function parseRSSFeed(channelId) {
  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(feedUrl);
    const xml = await response.text();

    const videoIds = [...xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)].map(m => m[1]);
    const titles = [...xml.matchAll(/<media:title>([^<]+)<\/media:title>/g)].map(m => m[1]);
    const links = [...xml.matchAll(/<link rel="alternate" href="([^"]+)"/g)].map(m => m[1]);
    const published = [...xml.matchAll(/<published>([^<]+)<\/published>/g)].map(m => m[1]);

    const entries = videoIds.map((videoId, i) => ({
      title: titles[i] || `Video ${i + 1}`,
      link: links[i] || "",
      videoId,
      published: published[i] || "",
      publishedDate: parseYouTubeDate(published[i]),
    }));

    // Trier par date YouTube (plus récent en premier)
    entries.sort((a, b) => {
      if (!a.publishedDate) return 1;
      if (!b.publishedDate) return -1;
      return b.publishedDate.getTime() - a.publishedDate.getTime();
    });

    return entries;
  } catch (error) {
    console.error("Error fetching RSS feed:", error);
    return [];
  }
}

// ─── Base de données ─────────────────────────────────────────────

async function getPageContentItems() {
  return db.select().from(pageContent).where(eq(pageContent.pageId, PAGE_ID));
}

async function getExistingVideoIds() {
  const items = await getPageContentItems();
  const existingIds = new Set();
  for (const item of items) {
    if (item.mediaUrl) {
      const match = item.mediaUrl.match(/v=([a-zA-Z0-9_-]{11})/);
      if (match) existingIds.add(match[1]);
    }
  }
  return existingIds;
}

async function createVideoContent(entry, existingIds, index) {
  const videoId = entry.videoId;
  if (!videoId) return false;

  if (existingIds.has(videoId)) {
    console.log(`⏭️ Vidéo déjà existante: ${entry.title}`);
    return false;
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const { date: culteDate, source } = resolveCulteDate({
    title: entry.title,
    description: null,
    publishedDate: entry.publishedDate,
  });
  const addedDateStr = formatShortDate(new Date());

  const title = buildTitle({ title: entry.title, culteDate });
  const description = buildDescription({ culteDate, addedDate: addedDateStr });

  if (!DRY_RUN) {
    await db.insert(pageContent).values({
      pageId: PAGE_ID,
      contentType: "youtube_video",
      title,
      mediaUrl: youtubeUrl,
      youtubeUrl,
      displayOrder: index,
      visible: true,
      loop: false,
      featuredHome: false,
      description,
      authorId: 1,
    });
  }

  console.log(`✅ Vidéo ${DRY_RUN ? "à ajouter" : "ajoutée"} (ordre ${index}): ${title}`);
  console.log(`   📅 Culte: ${culteDate ? formatFullFrenchDate(culteDate) : "date inconnue"} (source: ${source})`);
  console.log(`   📆 Ajouté: ${addedDateStr}`);
  return true;
}

/**
 * Met à jour les vidéos déjà en base pour que leur date soit celle du dimanche
 * du culte, et pas la date de mise en ligne YouTube. Idempotent : ne réécrit
 * une ligne que si son titre ou sa description change réellement.
 */
async function syncExistingVideoDates() {
  console.log(`🕗 Mise à jour des dates de culte des vidéos existantes${DRY_RUN ? " (simulation)" : ""}...`);

  const items = await getPageContentItems();
  const videos = items.filter(item => item.contentType === "youtube_video");

  let updated = 0;
  let unchanged = 0;
  let unknown = 0;
  // Valeurs attendues par identifiant, pour vérifier après coup qu'aucune ligne voisine n'a bougé.
  const expected = new Map();

  for (const item of videos) {
    const { date: culteDate, source } = resolveCulteDate({
      title: item.title,
      description: item.description,
      publishedDate: null,
      createdAt: item.createdAt,
    });

    if (!culteDate) {
      unknown++;
      console.log(`   ⚠️ Aucune date trouvée pour #${item.id}: ${item.title}`);
      continue;
    }

    const addedDate =
      extractAddedDateFromDescription(item.description) ||
      (item.createdAt ? formatShortDate(new Date(Number(item.createdAt) * 1000)) : formatShortDate(new Date()));

    const title = buildTitle({ title: item.title, culteDate });
    const description = buildDescription({ culteDate, addedDate });

    if (title === item.title && description === item.description) {
      unchanged++;
      continue;
    }

    console.log(`   ✏️ #${item.id} (${source})`);
    if (title !== item.title) {
      console.log(`      titre: ${item.title}`);
      console.log(`          →  ${title}`);
    }
    if (description !== item.description) {
      console.log(`      desc : ${item.description}`);
      console.log(`          →  ${description}`);
    }

    if (!DRY_RUN) {
      await db
        .update(pageContent)
        .set({ title, description })
        .where(eq(pageContent.id, item.id));
      expected.set(item.id, { title, description });
    }
    updated++;
  }

  console.log(
    `   ${DRY_RUN ? "À mettre à jour" : "Mises à jour"}: ${updated} · inchangées: ${unchanged}` +
      (unknown ? ` · sans date: ${unknown}` : ""),
  );

  // Contrôle final : chaque ligne doit porter exactement les valeurs qui lui sont destinées.
  if (expected.size > 0) {
    const after = await getPageContentItems();
    const drifted = after.filter(
      row => expected.has(row.id) && (expected.get(row.id).title !== row.title || expected.get(row.id).description !== row.description),
    );
    if (drifted.length > 0) {
      console.error(`   ⚠️ ${drifted.length} ligne(s) ne portent pas les valeurs attendues : ${drifted.map(r => `#${r.id}`).join(", ")}`);
    } else {
      console.log(`   ✔️ Contrôle: ${expected.size} ligne(s) enregistrée(s) exactement comme prévu`);
    }
  }

  return updated;
}

/** Supprime les vidéos dont la date de culte dépasse la fenêtre de conservation. */
async function cleanOldVideos() {
  console.log(`🧹 Nettoyage des vidéos de culte antérieures à ${MONTHS_TO_KEEP} mois...`);

  const items = await getPageContentItems();
  const limit = new Date();
  limit.setMonth(limit.getMonth() - MONTHS_TO_KEEP);

  let deleteCount = 0;

  for (const item of items) {
    if (item.contentType !== "youtube_video") continue;

    const { date: culteDate } = resolveCulteDate({
      title: item.title,
      description: item.description,
      publishedDate: null,
      createdAt: item.createdAt,
    });

    // Sans date fiable, on ne supprime rien : mieux vaut une vidéo de trop qu'une perte.
    if (!culteDate || culteDate >= limit) continue;

    if (!DRY_RUN) {
      await db.delete(pageContent).where(eq(pageContent.id, item.id));
    }
    console.log(`   🗑️ Supprimée: ${formatShortDate(culteDate)} — ${stripDatesFromTitle(item.title).slice(0, 60)}`);
    deleteCount++;
  }

  console.log(
    deleteCount > 0
      ? `✅ ${deleteCount} vidéo(s) ${DRY_RUN ? "à supprimer" : "supprimée(s)"} (plus de ${MONTHS_TO_KEEP} mois)`
      : "   ✅ Aucune vidéo à supprimer",
  );

  return deleteCount;
}

// ─── Exécution ───────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  🎬 Agent YouTube - Importation des Cultes");
  console.log(`  📅 Conservation: ${MONTHS_TO_KEEP} derniers mois`);
  console.log(`  🔗 Chaîne: ${YOUTUBE_CHANNEL_URL}`);
  if (DRY_RUN) console.log("  🧪 Mode simulation : aucune écriture en base");
  console.log("═══════════════════════════════════════════════════════");
  console.log("");

  // 1. Supprimer les cultes trop anciens
  if (SKIP_CLEAN) {
    console.log("⏭️ Nettoyage ignoré (--no-clean)");
  } else {
    await cleanOldVideos();
  }
  console.log("");

  const existingIds = await getExistingVideoIds();
  console.log(`📊 ${existingIds.size} vidéo(s) existante(s) dans la base`);

  // 2. Importer les nouvelles vidéos
  const entries = await parseRSSFeed(CHANNEL_ID);

  if (entries.length === 0) {
    console.log("⚠️ Aucune vidéo trouvée sur YouTube.");
    await syncExistingVideoDates();
    await client.close();
    return;
  }

  console.log(`📺 ${entries.length} vidéo(s) trouvée(s) sur YouTube`);
  console.log("");

  console.log("📋 Détail des vidéos (triées par date YouTube):");
  console.log("─────────────────────────────────────────────────");
  entries.slice(0, 5).forEach((entry, i) => {
    const { date, source } = resolveCulteDate({
      title: entry.title,
      description: null,
      publishedDate: entry.publishedDate,
    });
    const dateStr = date ? formatShortDate(date) : "date inconnue";
    console.log(`   ${i + 1}. culte ${dateStr} (${source}) - ${stripDatesFromTitle(entry.title).substring(0, 45)}`);
  });
  if (entries.length > 5) {
    console.log(`   ... et ${entries.length - 5} vidéo(s) supplémentaire(s)`);
  }
  console.log("");

  let newCount = 0;
  for (let i = 0; i < entries.length && i < MAX_VIDEOS_PER_RUN; i++) {
    const entry = entries[i];
    const added = await createVideoContent(entry, existingIds, i);
    if (added) {
      newCount++;
      existingIds.add(entry.videoId);
    }
  }

  // 3. Aligner les dates des vidéos déjà présentes (nouvelles comprises)
  console.log("");
  await syncExistingVideoDates();

  console.log("");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`✅ Résumé: ${newCount} nouvelle(s) vidéo(s) ${DRY_RUN ? "à ajouter" : "ajoutée(s)"}!`);
  console.log("═══════════════════════════════════════════════════════");

  await client.close();
}

main().catch(console.error);
