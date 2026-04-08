import { Resend } from "resend";
import { ENV } from "./env.js";
import { countAllArticles } from "../db.js"; // or wherever you get articles from

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name?: string | null) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Skipping welcome email.");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "News G12 Paris <news@g12parismedia.com>",
      to: [email],
      subject: "Bienvenue sur G12 Paris",
      html: `
        <div>
          <h1>Bienvenue ${name || "sur G12 Paris"} !</h1>
          <p>Merci de vous être abonné à notre newsletter. Vous recevrez désormais nos dernières actualités et publications.</p>
          <br />
          <p>L'équipe G12 Paris</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending welcome email:", error);
    }
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}

export async function sendWeeklyDigest(emails: string[], articles: any[]) {
  if (
    !process.env.RESEND_API_KEY ||
    emails.length === 0 ||
    articles.length === 0
  ) {
    return;
  }

  const articlesHtml = articles
    .map(
      article => `
      <div style="margin-bottom: 20px;">
        <h2>${article.title}</h2>
        <p>${article.excerpt || article.content.substring(0, 150) + "..."}</p>
        <a href="https://g12parismedia.com/articles/${article.slug}">Lire l'article</a>
      </div>
    `
    )
    .join("");

  try {
    const { data, error } = await resend.emails.send({
      from: "News G12 Paris <news@g12parismedia.com>",
      to: emails,
      subject: "Les dernières actualités de G12 Paris",
      html: `
        <div>
          <h1>Voici nos dernières publications</h1>
          ${articlesHtml}
          <br />
          <p>L'équipe G12 Paris</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending weekly digest:", error);
    }
  } catch (error) {
    console.error("Failed to send weekly digest:", error);
  }
}
