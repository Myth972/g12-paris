import { Resend } from "resend";
import { ENV } from "./env.js";
import { countAllArticles } from "../db.js"; // or wherever you get articles from

const resend = new Resend(process.env.RESEND_API_KEY);
const DEFAULT_FROM = "G12 Paris <onboarding@resend.dev>"; // Fallback if domain not verified
const ACTUAL_FROM = "G12 Paris <news@g12parismedia.com>";

export async function sendWelcomeEmail(email: string, name?: string | null) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Skipping welcome email.");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: ACTUAL_FROM,
      to: [email],
      subject: "Bienvenue sur G12 Paris",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1>Bienvenue ${name || "sur G12 Paris"} !</h1>
          <p>Merci de vous être abonné à notre newsletter. Vous recevrez désormais nos dernières actualités et publications.</p>
          <br />
          <p>L'équipe G12 Paris</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending welcome email:", error);
      // Try fallback if it's a domain error
      if (error.name === "validation_error") {
         await resend.emails.send({
           from: DEFAULT_FROM,
           to: [email],
           subject: "Bienvenue sur G12 Paris",
           html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h1>Bienvenue ${name || "sur G12 Paris"} !</h1>
              <p>Merci de vous être abonné à notre newsletter. Vous recevrez désormais nos dernières actualités et publications.</p>
              <br />
              <p>L'équipe G12 Paris</p>
            </div>
          `,
         });
      }
    }
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}

async function sendBatchedEmails(payload: { from: string, subject: string, html: string }, allEmails: string[]) {
  const batchSize = 45; // Resend limit is 50
  const results = [];
  
  for (let i = 0; i < allEmails.length; i += batchSize) {
    const batch = allEmails.slice(i, i + batchSize);
    try {
      const { data, error } = await resend.emails.send({
        ...payload,
        to: ["onboarding@resend.dev"], // Required 'to' field
        bcc: batch,
      });
      if (error) {
        console.error(`Error sending batch ${i / batchSize}:`, error);
        // If domain validation fails, try with default from
        if (error.message.includes("domain") || error.name === "validation_error") {
           const fallback = await resend.emails.send({
             ...payload,
             from: DEFAULT_FROM,
             to: ["onboarding@resend.dev"],
             bcc: batch,
           });
           results.push(fallback.data);
        } else {
          throw error;
        }
      } else {
        results.push(data);
      }
    } catch (err) {
      console.error(`Batch ${i / batchSize} failed:`, err);
      throw err;
    }
  }
  return results;
}

export async function sendWeeklyDigest(emails: string[], articles: any[], subject?: string) {
  if (!process.env.RESEND_API_KEY || emails.length === 0 || articles.length === 0) {
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

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #D97706; text-align: center; border-bottom: 2px solid #D97706; padding-bottom: 10px;">G12 Paris - Actualités</h1>
      <p style="color: #64748b; font-size: 16px;">Voici les dernières publications qui pourraient vous intéresser :</p>
      ${articlesHtml}
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #94a3b8; font-size: 12px;">
        <p>Vous recevez cet email car vous êtes abonné à la newsletter de G12 Paris.</p>
        <p>© ${new Date().getFullYear()} G12 Paris</p>
      </div>
    </div>
  `;

  return sendBatchedEmails({
    from: ACTUAL_FROM,
    subject: subject || "Les dernières actualités de G12 Paris",
    html
  }, emails);
}

export async function sendCustomNewsletter(emails: string[], subject: string, content: string) {
  if (!process.env.RESEND_API_KEY || emails.length === 0) {
    console.warn("Resend not configured or no emails. Skipping custom newsletter.");
    return;
  }

  const html = `
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
  `;

  return sendBatchedEmails({
    from: ACTUAL_FROM,
    subject,
    html
  }, emails);
}

export async function sendConventionConfirmation(email: string, firstName: string, lastName: string, ticketCode: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Skipping convention confirmation email.");
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: ACTUAL_FROM,
      to: [email],
      subject: `Confirmation inscription - Convention G12 France | Code: ${ticketCode}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #D97706; text-align: center; border-bottom: 2px solid #D97706; padding-bottom: 10px;">Convention G12 France</h1>
          <p style="color: #1e293b; font-size: 16px;">Bonjour ${firstName} ${lastName},</p>
          <p style="color: #1e293b; font-size: 16px;">Votre inscription à la Convention G12 France a bien été enregistrée. Nous avons hâte de vous accueillir !</p>
          <div style="margin: 30px 0; padding: 25px; background: #fef3c7; border-radius: 12px; text-align: center; border: 2px solid #f59e0b;">
            <p style="color: #92400e; font-size: 14px; margin-bottom: 8px;">Votre code d'inscription :</p>
            <p style="color: #92400e; font-size: 32px; font-weight: bold; letter-spacing: 6px; font-family: monospace; margin: 0;">${ticketCode}</p>
            <p style="color: #92400e; font-size: 12px; margin-top: 8px;">Conservez ce code, il vous sera demandé à l'entrée</p>
          </div>
          <div style="text-align: center; margin: 25px 0;">
            <a href="https://www.helloasso.com/associations/mci-lyon/evenements/convention-g12-france-2026" style="display: inline-block; background: #D97706; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Acheter mes billets</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">Vous recevrez des informations pratiques (lieu, horaires, programme) dans les prochains jours.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #94a3b8; font-size: 12px;">
            <p>© ${new Date().getFullYear()} G12 Paris</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending convention confirmation:", error);
    }
  } catch (error) {
    console.error("Failed to send convention confirmation:", error);
  }
}
