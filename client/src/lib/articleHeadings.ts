export interface TocSection {
  id: string;
  title: string;
  level: number;
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "section"
  );
}

export function extractHeadings(html: string): TocSection[] {
  const sections: TocSection[] = [];
  const seen = new Set<string>();
  const re = /<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const level = Number(match[1]);
    const raw = match[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
    if (!raw) continue;
    let id = slugify(raw);
    let n = 1;
    while (seen.has(id)) {
      n += 1;
      id = `${slugify(raw)}-${n}`;
    }
    seen.add(id);
    sections.push({ id, title: raw, level });
  }
  return sections;
}

export function injectHeadingIds(html: string, sections: TocSection[]): string {
  let index = 0;
  return html.replace(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (full) => {
    const section = sections[index];
    index += 1;
    if (!section || /id=/.test(full)) return full;
    return full.replace(/^<h([23])\b/, `<h$1 id="${section.id}"`);
  });
}