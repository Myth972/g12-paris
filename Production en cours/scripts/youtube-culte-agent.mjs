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
      });
    }
    
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
  
  let displayDate = "";
  if (entry.published) {
    const date = new Date(entry.published);
    displayDate = date.toLocaleDateString("fr-FR", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
  }
  
  await db.insert(pageContent).values({
    pageId: PAGE_ID,
    contentType: "youtube_video",
    title: displayDate ? `${entry.title} - ${displayDate}` : entry.title,
    mediaUrl: youtubeUrl,
    youtubeUrl: youtubeUrl,
    displayOrder: index, // Les plus récents en premier (index 0 = plus récent)
    visible: true,
    loop: false,
    featuredHome: false,
    description: entry.title,
    authorId: 1,
  });
  
  console.log(`✅ Vidéo ajoutée (ordre ${index}): ${entry.title}`);
  return true;
}

async function main() {
  console.log("🔍 Recherche de nouvelles vidéos YouTube...");
  console.log(`📺 Channel ID: ${CHANNEL_ID}`);
  
  const existingIds = await getExistingVideoIds();
  console.log(`📊 ${existingIds.size} vidéo(s) existante(s)`);
  
  const entries = await parseRSSFeed(CHANNEL_ID);
  
  if (entries.length === 0) {
    console.log("Aucune vidéo trouvée.");
    await client.close();
    return;
  }
  
  console.log(`📺 ${entries.length} vidéo(s) trouvée(s) sur YouTube`);
  
  let newCount = 0;
  // Les vidéos sont déjà triées par date (plus récent en premier)
  for (let i = 0; i < entries.length && i < 10; i++) {
    const entry = entries[i];
    const added = await createVideoContent(entry, existingIds, i);
    if (added) {
      newCount++;
      existingIds.add(entry.videoId);
    }
  }
  
  console.log(`✅ ${newCount} nouvelle(s) vidéo(s) ajoutée(s)!`);
  await client.close();
}

main().catch(console.error);