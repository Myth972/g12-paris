import { useEffect } from "react";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@shared/const";

export type SeoType = "website" | "article";

export interface SeoOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: SeoType;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  noIndex?: boolean;
  locale?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Transforme un chemin relatif en URL absolue.
 */
export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  if (typeof document === "undefined") return;
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  if (typeof document === "undefined") return;
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

function removeMeta(attribute: "name" | "property", key: string) {
  if (typeof document === "undefined") return;
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove();
}

function upsertJsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  if (typeof document === "undefined") return;
  let script = document.head.querySelector<HTMLScriptElement>(
    'script[data-seo-jsonld="1"]'
  );
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo-jsonld", "1");
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function removeJsonLd() {
  if (typeof document === "undefined") return;
  document.head
    .querySelector('script[data-seo-jsonld="1"]')
    ?.remove();
}

/**
 * Applique les balises SEO (title, description, Open Graph, Twitter Card, canonical)
 * au document courant. À utiliser dans chaque page publique.
 */
export function useSeo(options: SeoOptions) {
  const {
    title,
    description = SITE_DESCRIPTION,
    image,
    url,
    type = "website",
    publishedTime,
    modifiedTime,
    author,
    noIndex = false,
    locale = "fr_FR",
    jsonLd,
  } = options;

  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "/";
  const canonical = absoluteUrl(url ?? currentPath);
  const ogImage = image ? absoluteUrl(image) : absoluteUrl("/logo.png");

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.title = fullTitle;

    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", locale);
    upsertMeta("property", "og:image", ogImage);
    upsertMeta("property", "og:image:alt", title ?? SITE_NAME);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", ogImage);

    upsertLink("canonical", canonical);

    if (noIndex) {
      upsertMeta("name", "robots", "noindex, nofollow");
    } else {
      removeMeta("name", "robots");
    }

    if (publishedTime) {
      upsertMeta("property", "article:published_time", publishedTime);
    } else {
      removeMeta("property", "article:published_time");
    }

    if (modifiedTime) {
      upsertMeta("property", "article:modified_time", modifiedTime);
    } else {
      removeMeta("property", "article:modified_time");
    }

    if (author) {
      upsertMeta("property", "article:author", author);
    } else {
      removeMeta("property", "article:author");
    }

    if (jsonLd) {
      upsertJsonLd(jsonLd);
    } else {
      removeJsonLd();
    }
  }, [
    fullTitle,
    description,
    ogImage,
    canonical,
    type,
    locale,
    noIndex,
    publishedTime,
    modifiedTime,
    author,
    title,
    jsonLd,
  ]);
}
