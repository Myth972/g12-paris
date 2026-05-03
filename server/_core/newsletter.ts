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

export async function sendWeeklyDigest(emails: string[], articles: any[], subject?: string) {
  if (
    !process.env.RESEND_API_KEY ||
    emails.length === 0 ||
    articles.length === 0
  ) {
    console.warn("Resend not configured or no data. Skipping digest.");
    return;
  }

  const articlesHtml = articles
    .map(
      article => `
      <div style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
        <h2 style="color: #1e293b; margin-bottom: 5px;">${article.title}</h2>
        <p style="color: #475569; font-size: 14px;">${article.excerpt || article.content.substring(0, 150) + "..."}</p>
        <a href="https://g12parismedia.com/articles/${article.slug}" style="color: #D97706; font-weight: bold; text-decoration: none;">Lire la suite →</a>
      </div>
    `
    )
    .join("");

  try {
    const { data, error } = await resend.emails.send({
      from: "G12 Paris <news@g12parismedia.com>",
      to: emails,
      subject: subject || "Les dernières actualités de G12 Paris",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #D97706; text-align: center; border-bottom: 2px solid #D97706; padding-bottom: 10px;">G12 Paris - Actualités</h1>
          <p style="color: #64748b; font-size: 16px;">Voici les dernières publications qui pourraient vous intéresser :</p>
          ${articlesHtml}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #94a3b8; font-size: 12px;">
            <p>Vous recevez cet email car vous êtes abonné à la newsletter de G12 Paris.</p>
            <p>© ${new Date().getFullYear()} G12 Paris</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending weekly digest:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Failed to send weekly digest:", error);
    throw error;
  }
}

export async function sendCustomNewsletter(emails: string[], subject: string, content: string) {
  if (!process.env.RESEND_API_KEY || emails.length === 0) {
    console.warn("Resend not configured or no emails. Skipping custom newsletter.");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "G12 Paris <news@g12parismedia.com>",
      to: emails,
      subject: subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #D97706; text-align: center; border-bottom: 2px solid #D97706; padding-bottom: 10px;">G12 Paris</h1>
          <div style="color: #1e293b; font-size: 16px; line-height: 1.6; margin-top: 20px;">
            ${content.replace(/\n/g, "<br />")}
          </div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #94a3b8; font-size: 12px;">
            <p>Vous recevez cet email car vous êtes abonné à la newsletter de G12 Paris.</p>
            <p>© ${new Date().getFullYear()} G12 Paris</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending custom newsletter:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Failed to send custom newsletter:", error);
    throw error;
  }
}
