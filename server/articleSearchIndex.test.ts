import { describe, it, expect } from "vitest";
import { stripHtml, truncateText } from "./articleSearchIndex";

describe("stripHtml", () => {
  it("retire les balises et renvoie du texte", () => {
    expect(stripHtml("<p>Bonjour <strong>Paris</strong></p>")).toBe(
      "Bonjour Paris"
    );
  });

  it("supprime les blocs dont le contenu ne doit pas être indexé", () => {
    const html = `
      <p>Visible</p>
      <script>var secret = "index moi pas";</script>
      <style>.a{color:red}</style>
      <noscript>activez js</noscript>
    `;
    const text = stripHtml(html);
    expect(text).toContain("Visible");
    expect(text).not.toContain("index moi pas");
    expect(text).not.toContain("color:red");
    expect(text).not.toContain("activez js");
  });

  it("n'indexe pas les urls contenues dans les attributs", () => {
    const html =
      '<p>Voir <a href="https://example.com/page?utm_source=x">le lien</a></p>' +
      '<img src="https://cdn.exemple.com/photo-benie.jpg" alt="photo">';
    const text = stripHtml(html);
    expect(text).toContain("le lien");
    expect(text).not.toContain("example.com");
    expect(text).not.toContain("utm_source");
    expect(text).not.toContain("benie.jpg");
  });

  it("décode les entités HTML courantes", () => {
    expect(stripHtml("<p>R&amp;D &nbsp;&eacute;&egrave;ve</p>")).toBe(
      "R&D éève"
    );
    expect(stripHtml("<p>L&#39;amour &quot;divin&quot;</p>")).toContain(
      "'amour"
    );
    expect(stripHtml("<p>caf&#233;</p>")).toBe("café");
    expect(stripHtml("<p>caf&#xe9;</p>")).toBe("café");
  });

  it("préserve les accents", () => {
    expect(stripHtml("<h2>La bénédiction</h2><p>communion</p>")).toBe(
      "La bénédiction communion"
    );
  });

  it("sépare proprement les blocs pour ne pas coller deux mots", () => {
    expect(stripHtml("<p>fin</p><p>début</p>")).toBe("fin début");
    expect(stripHtml("mot1<br>mot2")).toBe("mot1 mot2");
  });

  it("renvoie une chaîne vide pour une entrée vide ou absente", () => {
    expect(stripHtml("")).toBe("");
    expect(stripHtml(undefined as unknown as string)).toBe("");
    expect(stripHtml("   ")).toBe("");
  });

  it("résiste à une balise non fermée", () => {
    expect(stripHtml("<p>texte")).toBe("texte");
  });
});

describe("truncateText", () => {
  it("ne touche pas un texte déjà court", () => {
    expect(truncateText("court", 100)).toBe("court");
  });

  it("tronque sur une frontière de mot, sans couper un mot en deux", () => {
    const text = "un deux trois quatre cinq six sept huit";
    const result = truncateText(text, 20);
    expect(result).toBe("un deux trois");
    // Chaque mot retourné existe tel quel dans la source.
    for (const word of result.split(" ")) {
      expect(text.split(" ")).toContain(word);
    }
  });

  it("coupe net quand aucun mot ne tient dans la limite", () => {
    expect(truncateText("a".repeat(50), 10)).toBe("aaaaaaaaaa");
  });

  it("tronque sur le premier espace quand il est suffisamment tardif", () => {
    expect(truncateText("alpha beta gamma", 7)).toBe("alpha");
  });

  it("préfère un mot entier même s'il déborde un peu", () => {
    // "premiers mots" : le dernier espace est au dela du seuil de 60 %.
    const text = "une phrase avec beaucoup de mots ici pour tester";
    const result = truncateText(text, 10);
    expect(text.startsWith(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(10);
  });
});
