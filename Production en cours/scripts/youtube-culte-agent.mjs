// @ts-nocheck
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { pageContent } from "../drizzle/schema.ts";

const client = createClient({
  url: "libsql://g12-paris-myth972.aws-eu-west-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE4MDMwNzA4MzgsImlhdCI6MTc3MTUzNDgzOCwiaWQiOiIwZWNlYWQ1NC0yMjU5LTQ1ZmItOWJlNC04M2IyMWNkYTZiMGQiLCJyaWQiOiI3MGRiZmJhYi1jZGZjLTQxNjQtYjI0Zi01MGE2YWYwNDMwMmYifQ.ONGUMq6guiYAMvTNdU_aZj6Zip4SEA4SwNXfgw0N1TDiOdXqKO2CmUoEudsmfbQLv6w6BiGsYqgJ36wIgASSDw",
});

const db = drizzle(client);

const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@media.mpecciparis";
const CHANNEL_ID = "UCAM9d_c1ky-lTSook4ffXbA";
const PAGE_ID = "culte-en-ligne";

// Garder uniquement les vidéos des 3 derniers mois
const MONTHS_TO_KEEP = 3;

function parseYouTubeDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr);
}

function formatYouTubeDate(date) {
  if (!date) return "";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function formatShortDate(date) {
  if (!date) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatAddedDate() {
  const now = new Date();
  return now.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// Extraire la date YouTube depuis la description
function extractYouTubeDateFromDescription(description) {
  if (!description) return null;
  const match = description.match(/Publié sur YouTube: (.+?) \|/);
  if (!match) return null;
  
  // Parser la date française
  const dateStr = match[1];
  const months = {
    "janvier": 0, "février": 1, "mars": 2, "avril": 3, "mai": 4, "juin": 5,
    "juillet": 6, "août": 7, "septembre": 8, "octobre": 9, "novembre": 10, "décembre": 11
  };
  
  // Format: "lundi 12 avril 2026" ou "dimanche 16 février 2026"
  const parts = dateStr.split(" ");
  if (parts.length >= 3) {
    const day = parseInt(parts[1]);
    const monthName = parts[2].toLowerCase();
    const year = parseInt(parts[3]);
    const month = months[monthName];
    
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return null;
}

// Vérifier si la vidéo est plus vieille que 3 mois
function isVideoOlderThanMonths(description) {
  const videoDate = extractYouTubeDateFromDescription(description);
  if (!videoDate) return false;
  
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - MONTHS_TO_KEEP);
  
  return videoDate < threeMonthsAgo;
}

async function parseRSSFeed(channelId) {
  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(feedUrl);
    const xml = await response.text();
    
    const entries = [];
    const videoIdRegex = /<yt:videoId>([^<]+)<\/yt:videoId>/g;
    const titleRegex = /<media:title>([^<]+)<\/media:title>/g;
    const linkRegex = /<link rel="alternate" href="([^"]+)"/g;
    const publishedRegex = /<published>([^<]+)<\/published>/g;
    
    const videoIds = [...xml.matchAll(videoIdRegex)].map(m => m[1]);
    const titles = [...xml.matchAll(titleRegex)].map(m => m[1]);
    const links = [...xml.matchAll(linkRegex)].map(m => m[1]);
    const published = [...xml.matchAll(publishedRegex)].map(m => m[1]);
    
    for (let i = 0; i < videoIds.length; i++) {
      entries.push({
        title: titles[i] || `Video ${i + 1}`,
        link: links[i] || "",
        videoId: videoIds[i],
        published: published[i] || "",
        publishedDate: parseYouTubeDate(published[i]),
      });
    }
    
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

// Récupérer toutes les vidéos existantes pour comparaison
async function getExistingVideoIds() {
  const result = await db
    .select({ mediaUrl: pageContent.mediaUrl })
    .from(pageContent)
    // @ts-ignore
    .where(pageContent.pageId === PAGE_ID);
  
  // Extraire les IDs des URLs
  const existingIds = new Set();
  for (const item of result) {
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
  
  // Formater la date de publication YouTube
  const youtubeDateStr = entry.publishedDate ? formatYouTubeDate(entry.publishedDate) : "";
  const shortDateStr = entry.publishedDate ? formatShortDate(entry.publishedDate) : "";
  const addedDateStr = formatAddedDate();
  
  // Titre avec date YouTube
  const title = shortDateStr ? `Culte du ${shortDateStr}` : entry.title;
  
  // Description avec les deux dates
  const description = `Publié sur YouTube: ${youtubeDateStr || "date inconnue"} | Ajouté sur le site: ${addedDateStr}`;
  
  await db.insert(pageContent).values({
    pageId: PAGE_ID,
    contentType: "youtube_video",
    title: title,
    mediaUrl: youtubeUrl,
    youtubeUrl: youtubeUrl,
    displayOrder: index,
    visible: true,
    loop: false,
    featuredHome: false,
    description: description,
    authorId: 1,
  });
  
  console.log(`✅ Vidéo ajoutée (ordre ${index}): ${title}`);
  console.log(`   📅 YouTube: ${youtubeDateStr}`);
  console.log(`   📆 Ajouté: ${addedDateStr}`);
  return true;
}

async function updateExistingVideosWithDates() {
  // Mettre à jour les vidéos existantes avec les dates si pas encore fait
  const existing = await db
    .select()
    .from(pageContent)
    // @ts-ignore
    .where(pageContent.pageId === PAGE_ID);
  
  let updateCount = 0;
  for (const item of existing) {
    if (item.description && item.description.includes("Publié sur YouTube:")) {
      continue; // Déjà mis à jour
    }
    
    // Essayer d'extraire la date du titre ou de la description
    // Pour l'instant, on laisse tel quel
  }
  
  return updateCount;
}

async function cleanOldVideos() {
  console.log("🧹 Nettoyage des vidéos plus anciennes que 3 mois...");
  
  const existing = await db
    .select()
    .from(pageContent)
    // @ts-ignore
    .where(pageContent.pageId === PAGE_ID);
  
  let deleteCount = 0;
  
  for (const item of existing) {
    if (item.contentType === "youtube_video" && isVideoOlderThanMonths(item.description)) {
      await db
        .delete(pageContent)
        // @ts-ignore
        .where(pageContent.id === item.id);
      
      const shortDate = item.title.replace("Culte du ", "");
      console.log(`   🗑️ Supprimée: ${shortDate}`);
      deleteCount++;
    }
  }
  
  if (deleteCount > 0) {
    console.log(`✅ ${deleteCount} vidéo(s) supprimée(s) (plus de ${MONTHS_TO_KEEP} mois)`);
  } else {
    console.log("   ✅ Aucune vidéo à supprimer");
  }
  
  return deleteCount;
}

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  🎬 Agent YouTube - Importation des Cultes");
  console.log(`  📅 Conservation: ${MONTHS_TO_KEEP} derniers mois`);
  console.log("═══════════════════════════════════════════════════════");
  console.log("");
  
  // 1. Nettoyer les anciennes vidéos
  await cleanOldVideos();
  console.log("");
  
  const existingIds = await getExistingVideoIds();
  console.log(`📊 ${existingIds.size} vidéo(s) existante(s) dans la base`);
  
  const entries = await parseRSSFeed(CHANNEL_ID);
  
  if (entries.length === 0) {
    console.log("⚠️ Aucune vidéo trouvée sur YouTube.");
    await client.close();
    return;
  }
  
  console.log(`📺 ${entries.length} vidéo(s) trouvée(s) sur YouTube`);
  console.log("");
  
  // Afficher le détail des vidéos trouvées
  console.log("📋 Détail des vidéos (triées par date YouTube):");
  console.log("─────────────────────────────────────────────────");
  entries.slice(0, 5).forEach((entry, i) => {
    const dateStr = entry.publishedDate ? formatShortDate(entry.publishedDate) : "date inconnue";
    console.log(`   ${i + 1}. ${dateStr} - ${entry.title.substring(0, 50)}...`);
  });
  if (entries.length > 5) {
    console.log(`   ... et ${entries.length - 5} vidéo(s) supplémentaire(s)`);
  }
  console.log("");
  
  let newCount = 0;
  // Les vidéos sont triées par date (plus récent en premier)
  for (let i = 0; i < entries.length && i < 10; i++) {
    const entry = entries[i];
    const added = await createVideoContent(entry, existingIds, i);
    if (added) {
      newCount++;
      existingIds.add(entry.videoId);
    }
  }
  
  console.log("");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`✅ Résumé: ${newCount} nouvelle(s) vidéo(s) ajoutée(s)!`);
  console.log("═══════════════════════════════════════════════════════");
  
  await client.close();
}

main().catch(console.error);