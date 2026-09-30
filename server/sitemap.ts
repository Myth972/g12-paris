import { SITE_URL } from "../shared/const.js";
import { articles, categories } from "../drizzle/schema.js";
import { asc, desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "./db.js";

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq: string;
  priority: string;
}

const STATIC_ROUTES: SitemapEntry[] = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/publication-du-jour", changefreq: "daily", priority: "0.9" },
  { loc: "/galeries", changefreq: "weekly", priority: "0.7" },
  { loc: "/evenements", changefreq: "weekly", priority: "0.8" },
  { loc: "/evenements/jeunes", changefreq: "monthly", priority: "0.6" },
  { loc: "/evenements/archives", changefreq: "monthly", priority: "0.5" },
  { loc: "/culte-en-ligne", changefreq: "weekly", priority: "0.9" },
  { loc: "/culte-en-ligne/convention", changefreq: "monthly", priority: "0.6" },
  { loc: "/bibliotheque", changefreq: "weekly", priority: "0.8" },
  { loc: "/bibliotheque/catalogue", changefreq: "weekly", priority: "0.8" },
  { loc: "/bibliotheque/etude", changefreq: "monthly", priority: "0.6" },
  { loc: "/bibliotheque/themes", changefreq: "monthly", priority: "0.6" },
  { loc: "/bibliotheque/offres", changefreq: "weekly", priority: "0.6" },
  { loc: "/bibliotheque/vision", changefreq: "monthly", priority: "0.5" },
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

export async function buildSitemapXml(): Promise<string> {
  const entries: SitemapEntry[] = [...STATIC_ROUTES];

  try {
    const db = getDb();

    if (db) {
      const [articleRows, categoryRows] = await Promise.all([
        db
          .select({
            slug: articles.slug,
            updatedAt: articles.updatedAt,
            createdAt: articles.createdAt,
          })
          .from(articles)
          .where(eq(articles.published, true))
          .orderBy(desc(articles.updatedAt))
          .limit(5000),
        db
          .select({ slug: categories.slug })
          .from(categories)
          .where(isNotNull(categories.slug))
          .orderBy(asc(categories.name))
          .limit(500),
      ]);

      for (const row of articleRows) {
        entries.push({
          loc: `/article/${encodeURIComponent(row.slug)}`,
          lastmod: toIso(row.updatedAt ?? row.createdAt),
          changefreq: "monthly",
          priority: "0.8",
        });
      }

      for (const row of categoryRows) {
        entries.push({
          loc: `/categorie/${encodeURIComponent(row.slug)}`,
          changefreq: "weekly",
          priority: "0.6",
        });
      }
    }
  } catch (error) {
    console.error("[Sitemap] Failed to load dynamic entries:", error);
  }

  const body = entries
    .map((entry) => {
      const parts = [`    <loc>${escapeXml(`${SITE_URL}${entry.loc}`)}</loc>`];
      if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      parts.push(`    <priority>${entry.priority}</priority>`);
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function buildRobotsTxt(): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /admin/",
    "Disallow: /login",
    "Disallow: /panier",
    "Disallow: /convention/verify",
    "Disallow: /inscription-convention",
    "Disallow: /api/",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}
