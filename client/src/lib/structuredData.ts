import { SITE_NAME, SITE_URL } from "@shared/const";
import { absoluteUrl } from "@/lib/seo";

const ORGANIZATION = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: absoluteUrl("/logo.png"),
  },
  sameAs: [
    "https://www.facebook.com/G12France/",
    "https://www.instagram.com/cci.paris/",
    "https://www.youtube.com/@media.mpecciparis",
  ],
};

export function organizationJsonLd(): Record<string, unknown> {
  return ORGANIZATION;
}

export function webSiteJsonLd(): Record<string, unknown> {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "fr-FR",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export interface NewsArticleInput {
  title: string;
  description?: string;
  slug: string;
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

export function newsArticleJsonLd(input: NewsArticleInput) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/article/${input.slug}`),
    },
    headline: input.title,
    description: input.description,
    image: [absoluteUrl(input.image || "/logo.png")],
    datePublished: input.publishedTime,
    dateModified: input.modifiedTime || input.publishedTime,
    author: input.author
      ? { "@type": "Person", name: input.author }
      : { "@id": `${SITE_URL}/#organization` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "fr-FR",
  };
}

export interface EventInput {
  name: string;
  description?: string;
  startDate?: string;
  location?: string;
  image?: string;
  url: string;
}

function toIsoDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function eventJsonLd(input: EventInput) {
  const startDate = toIsoDate(input.startDate);
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    description: input.description,
    startDate,
    image: [absoluteUrl(input.image || "/logo.png")],
    url: absoluteUrl(input.url),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: "fr-FR",
    location: input.location
      ? {
          "@type": "Place",
          name: input.location,
          address: {
            "@type": "PostalAddress",
            addressLocality: "Paris",
            addressCountry: "FR",
          },
        }
      : undefined,
    organizer: { "@id": `${SITE_URL}/#organization` },
  };
}
