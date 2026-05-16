import initSqlJs from "sql.js";

const SQL = await initSqlJs();
const db = new SQL.Database();

const data = await fetch("./sqlite.db").then(r => r.arrayBuffer());
db.read(new Uint8Array(data));

const books = [
  {
    title: "Listes pour vivre mieux",
    slug: "listes-pour-vivre-mieux",
    excerpt: "Des listes inspirantes pour guider votre quotidien spirituel.",
    content: "<p>Un outil précieux pour approfondir votre vie spirituelle au quotidien.</p>",
    category: "bibliothèque:livre:etude",
    published: 1,
    authorId: 1,
    price: 1299,
    affiliateUrl: "https://www.clcfrance.com/produit/listes-pour-vivre-mieux-esrl010-9782375590164?srsltid=AfmBOopkexHprmuciaHu0jzBzn0snHjr1qtQpZnZi-HPDlbeyOniW-L2",
    meta: JSON.stringify({ author: "", publisher: "CLC France", format: "ebook", isbn: "9782375590164" }),
  },
  {
    title: "Cartes pour vivre mieux",
    slug: "cartes-pour-vivre-mieux",
    excerpt: "Des cartes pour méditer et vivre selon les principes bibliques.",
    content: "<p>Un deck de cartes pour accompagner votre quotidien spirituel.</p>",
    category: "bibliothèque:livre:etude",
    published: 1,
    authorId: 1,
    price: 1999,
    affiliateUrl: "https://www.clcfrance.com/produit/cartes-pour-vivre-mieux-bb-c150-3770017461039?sq=Cartes+pour+vivre+mieux",
    meta: JSON.stringify({ author: "", publisher: "CLC France", format: "ebook", isbn: "3770017461039" }),
  },
  {
    title: "Bible femmes à son écoute",
    slug: "bible-femmes-a-son-ecoute",
    excerpt: "Une Bible adaptée pour les femmes, avec des méditations et réflexions.",
    content: "<p>Une Bible Segond 1910 spécialement conçue pour les femmes.</p>",
    category: "bibliothèque:livre:bibles",
    published: 1,
    authorId: 1,
    price: 3999,
    affiliateUrl: "https://www.clcfrance.com/produit/bible-femmes-a-son-ecoute-fase-segond-1910-mimb080-9782895761792?srsltid=AfmBOorKdoX7WGudzoTR39A8KeyxMdIKWeOyXnaVSSKfquU3TphZoQrh",
    meta: JSON.stringify({ author: "", publisher: "CLC France", format: "ebook", isbn: "9782895761792" }),
  },
];

for (const book of books) {
  try {
    db.run(`
      INSERT INTO articles (title, slug, excerpt, content, category, published, authorId, price, affiliateUrl, meta, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [book.title, book.slug, book.excerpt, book.content, book.category, book.published, book.authorId, book.price, book.affiliateUrl, book.meta]);
    console.log(`✓ Ajouté: ${book.title}`);
  } catch (e) {
    console.log(`✗ Erreur pour ${book.title}:`, e.message);
  }
}

const dataOut = db.export();
const buffer = Buffer.from(dataOut);
await Bun.write("sqlite.db", buffer);

console.log("Terminé!");

db.close();